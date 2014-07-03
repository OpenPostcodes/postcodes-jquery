/*! Open Postcodes jQuery Plugin - v1.0.0 - 2014-06-24
* https://github.com/OpenPostcodes/postcodes-jquery
* Copyright (c) 2014 Open Postcodes; MIT */

(function($) {
  "use strict";
  var openInstances = [];
  var globalInstance;
  var defaults = {
    // Enter your API Key
    api_key: "",

    // Required Fields to Populate your Form
    // Please enter an appropriate CSS selector that
    // uniquely identifies the input field you wish
    // the result to be piped in
    output_fields: {
      line_1: "#line1",
      line_2: "#line2",
      line_3: "#line3",
      post_town: "#town",
      postcode: "#postcode",
      postcode_inward: undefined,
      postcode_outward: undefined,
      udprn: undefined,
      dependant_locality: undefined,
      double_dependant_locality: undefined,
      thoroughfare: undefined,
      dependant_thoroughfare: undefined,
      building_number: undefined,
      building_name: undefined,
      sub_building_name: undefined,
      po_box: undefined,
      department_name: undefined,
      organisation_name: undefined,
      postcode_type: undefined,
      su_organisation_indicator: undefined,
      delivery_point_suffix: undefined
    },
    
    /* 
     * Below not required
     */

    api_endpoint: "https://api.openpostcodes.com/v1",

    // Input Postcode Field Configuration
    input: undefined,
    $input: undefined,
    input_label: "Enter your Postcode",
    input_muted_style: "color:#CBCBCB;",
    input_class: "",
    input_id: "opc_input",

    // Button Lookup Configuration
    button: undefined,
    $button: undefined,
    button_id: "opc_button",
    button_label: "Find your Address",
    button_class: "",
    button_disabled_message: "Fetching Addresses...",

    // Dropdown Address Configuration
    $dropdown: undefined,
	dropdown_separator: ",",
    dropdown_id: "opc_dropdown",
    dropdown_select_message: "Select your Address",
    dropdown_class: "",

    // Error Message Configuration
    $error_message: undefined,
    error_message_id: "opc_error_message",
    error_message_postcode_invalid: "Please recheck your postcode, it seems to be incorrect",
    error_message_postcode_not_found: "Your postcode could not be found. Please type in your address",
    error_message_default: "We were not able to your address from your Postcode. Please input your address manually",
    error_message_class: "",

    // Prevent Unnecessary Lookups
    lookup_interval: 1000, // Disables lookup button in (ms) after click

    // Debug. Set to true to output API error messages to client
    debug_mode: false,

    // Register callbacks at specific stages
    onLookupSuccess: undefined,
    onLookupError: undefined,
    onAddressSelected: undefined
  };

  function Postcodes (options) {
    // Load the defaults
    this.config = {};
    $.extend(this, defaults);

    // Override with options
    if (options) {
      $.extend(this, options);
    }

    // Convert output_fields container to jQuery objects
    var $output_fields = {};
    for (var key in this.output_fields) {
      if (this.output_fields[key] !== undefined) {
        $output_fields[key] = $(this.output_fields[key]);
      }
    }
    this.$output_fields = $output_fields;
  }


  Postcodes.prototype.setupPostcodeInput = function (context) {
    this.$context = context;
    this.setupInputField();
    this.setupLookupButton();
  };

  /*
   * Connects an Input field to the plugin to collect postcodes
   *
   * If a selector (this.input) is specified, that input is used
   * If no selector specified, a new input field is generated and added to context
   */

  Postcodes.prototype.setupInputField = function () {
    var self = this;
    if ($(this.input).length) {
      // Use custom input
      this.$input = $(this.input).first();
    } else {
      // Create & add input field to DOM
      this.$input = $('<input />', {
        type: "text",
        id: this.input_id,
        value: this.input_label
      })
      .appendTo(this.$context)
      .addClass(this.input_class)
      .val(this.input_label)
      .attr("style", this.input_muted_style)
      .submit(function () {
        return false;
      })
      .keypress(function (event) {
        if (event.which === 13) {
          self.$button.trigger("click");
        }
      })
      .focus(function () {
        self.$input.removeAttr('style').val("");
      })
      .blur(function () {
        if (!self.$input.val()) {
          self.$input.val(self.input_label);
          self.$input.attr('style', self.input_muted_style);
        }
      });
    }
    return this.$input;
  };

  /*
   * Connects Clickable element to the Plugin to Trigger
   */

  Postcodes.prototype.setupLookupButton = function () {
    var self = this;
    if ($(this.button).length) {
      this.$button = $(this.button).first();
    } else {
      this.$button = $('<button />', {
        html: this.button_label,
        id: this.button_id,
        type: "button"
      })
      .appendTo(this.$context)
      .addClass(this.button_class)
      .attr("onclick", "return false;")
      .submit(function () {
        return false;
      });
    }
    this.$button.click(function () {
      var postcode = self.$input.val();
      self.disableLookup();
      self.clearAll();
      self.lookupPostcode(postcode);
    });
    return this.$button;
  };

  /*
   * Prevent Lookup Button from being fired
   */

  Postcodes.prototype.disableLookup = function (message) {
    message = message || this.button_disabled_message;
    this.$button.prop('disabled', true).html(message);
  };

  /*
   * Allow Lookup Button to be fired
   */

  Postcodes.prototype.enableLookup = function () {
    var self = this;
    if (self.lookup_interval === 0) {
      self.$button.prop('disabled', false).html(self.button_label);
    } else {
      setTimeout(function (){
        self.$button.prop('disabled', false).html(self.button_label);
      }, self.lookup_interval);
    }
  }; 

  /*
   * Clears the Fields
   */

  Postcodes.prototype.clearAll = function () {
    this.setDropDown();
    this.setErrorMessage();
    this.setAddressFields();
  };

  /*
   * Removes all Elements
   */

  Postcodes.prototype.removeAll = function () {
    this.$context = null;

    $.each([this.$input, this.$button, this.$dropdown, this.$error_message], function (index, element) {
      if (element) {
        element.remove();
      }
    });
  };

  /*
   * Triggers a Postcode Lookup
   */

  Postcodes.prototype.lookupPostcode = function (postcode) {
    var self = this;
    if (!$.openPostcodes.validatePostcodeFormat(postcode)) {
      this.enableLookup();
      return self.setErrorMessage(this.error_message_postcode_invalid);
    }

    $.openPostcodes.lookupPostcode(postcode, self.api_key, 
      // Successful
      function (data) {
        self.response_code = data.code;
        self.response_message = data.message;
        self.result = data.result;
        self.enableLookup();

        if (self.response_code === 2000) {
          self.setDropDown(self.result);
        } else if (self.response_code === 4040) {
          self.setErrorMessage(self.error_message_postcode_not_found); 
        } else {
          if (self.debug_mode) {
            self.setErrorMessage("(" + self.response_code + ") " + self.response_message);
          } else {
            self.setErrorMessage(self.error_message_default);  
          } 
        }
        if (self.onLookupSuccess) {
          self.onLookupSuccess(data);
        }
      }, 
      // Unsuccessful result
      function () {
        self.setErrorMessage("Unable to connect to server");
        self.enableLookup();
        if (self.onLookupError) {
          self.onLookupError();
        }
      }
    );
  };

  /*
   * Set the Dropdown
   *
   * Removes Dropdown from DOM if data is undefined
   */

  Postcodes.prototype.setDropDown = function (data) {
    var self = this;

    // Remove Dropdown menu
    if (this.$dropdown && this.$dropdown.length) {
      this.$dropdown.remove();
      delete this.$dropdown;
    }

    // Return if undefined
    if (!data) {
      return;
    }

    var dropDown = $('<select />', {
      id: self.dropdown_id
    }).
    addClass(self.dropdown_class);

    $('<option />', {
      value: "open",
      text: self.dropdown_select_message
    }).appendTo(dropDown);
    
    var length = data.length;
    for (var i = 0; i < length; i += 1) {
      $('<option />', {
        value: i,
        text: data[i].line_1 + ((data[i].line_2==='') ? '' : self.dropdown_separator + ' ' + data[i].line_2)
      }).appendTo(dropDown);
    }

    dropDown.appendTo(self.$context)
    .change(function () {
      var index = $(this).val();
      if (index >= 0) {
        self.setAddressFields(data[index]);
        if (self.onAddressSelected) {
          self.onAddressSelected.call(this, data[index]);
        }
      }
    });
    
    self.$dropdown = dropDown;

    return dropDown;
  };

  /*
   * Set Error Message
   *
   * Removes Error from DOM if undefined
   */

  Postcodes.prototype.setErrorMessage = function (message) {
    if (this.$error_message && this.$error_message.length) {
      this.$error_message.remove();
      delete this.$error_message;
    }

    if (!message) {
      return;
    }

    // Enable lookup button
    // opc.enable_lookup_button();
    this.$error_message = $('<p />', {
      html: message,
      id: this.error_message_id
    })
    .addClass(this.error_message_class)
    .appendTo(this.$context);

    return this.$error_message;
  };

  /*
   * Set Address Output Fields
   *
   * Clears output fields if undefined
   */

  Postcodes.prototype.setAddressFields = function (data) {
    data = data || {};

    for (var key in this.$output_fields) {
      this.$output_fields[key].val(data[key] || "");
    }
  };

  $.openPostcodes = {

    // Expose Defaults for Testing Purposes
    defaults: function () {
      return defaults;
    },

    // Call to register key, configure misc options
    setup: function (options) {
      globalInstance = new Postcodes(options);
      openInstances.push(globalInstance);
    },

    validatePostcodeFormat: function (postcode) {
      return !!postcode.match(/^[a-zA-Z0-9]{1,4}\s?\d[a-zA-Z]{2}$/);
    },

    // Lookup Postcode using Open Postcodes API
    lookupPostcode: function (postcode, api_key, success, error) {
      var endpoint = defaults.api_endpoint,
          resource = "postcodes",
          url = [endpoint, resource, postcode].join('/'),
          options = {
            url: url,
            data: {
              api_key: api_key
            },
            dataType: 'jsonp',
            timeout: 5000,
            success: success
          };

      if (error) {
        options.error = error;
      }

      $.ajax(options);
    },

    clearAll: function () {
      var length = openInstances.length;
      for (var i = 0; i < length; i += 1) {
        openInstances[i].removeAll();
      }
    }

  };

  // Creates the Postcode Lookup field and button when called on the <div>
  $.fn.lookupPostcodeForm = function (options) {
    if (options) {
      // Create new Postcode lookup instance
      var postcodeLookup = new Postcodes(options);
      openInstances.push(postcodeLookup);
      postcodeLookup.setupPostcodeInput($(this));
    } else {
      // Use global postcode lookup instance
      globalInstance.setupPostcodeInput($(this));
    }
    return this;
  };

}(jQuery));
