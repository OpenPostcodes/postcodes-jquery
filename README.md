# jQuery UK Postcode Lookup Plugin

Retrieve a list of addresses for any postcode in the United Kingdom using the Open Postcodes API via a jQuery form plugin.

We charge **1p** per public lookup; take a look at our [pricing](https://openpostcodes.com/pricing)

## How it works

This jQuery plugin adds an additional text field to any web form, allowing a user to input any UK Postcode. The plugin uses the Open Postcodes API to lookup the provided Postcode and return a list of premisses, associated with the Postcode, as a dropdown. Once a premise is selected, from the dropdown, the plugin with fill the appropriate address form fields.

![Open Postcodes Plugin Demo](https://raw.github.com/OpenPostcodes/postcodes-jquery/master/example/demo.png)

## Getting Started
1) **[Download plugin](https://raw.github.com/OpenPostcodes/postcodes-jquery/master/dist/postcode.min.js)** and the script to your page, as shown below

```html
<script src="jquery.js"></script>
<script src="jquery.postcode.min.js"></script>
```

2) **[Sign up](https://openpostcodes.com/signup)** to create an API key

3) **Postcode Search Field** create a div tag and name it `postcode_lookup` for example, then use it to call `.lookupPostcodeForm()`. Add your config to the call, such as your API key, and the CSS selectors with where to send the output data.

```html
<div id="postcode_lookup"></div>

<script>
$('#postcode_lookup').lookupPostcodeForm({
    api_key: 'openpostcodes_demo', // Change to your API key
    output_fields:{
        line_1: '#line1',
        line_2: '#line2',
        line_3: '#line3',
        post_town: '#town',
        postcode: '#postcode'
    }
});
</script>
```

## Additional Data

You can use more data from the API response other than the ones in the example, by adding the extra parameters to the output_fields, a full list of these parameters are shown in the Open Postcodes documentation [here](https://openpostcodes.com/documentation#postcode).

## Documentation

[In depth documentation can be found at Open Postcodes](https://openpostcodes.com/documentation#examples-jquery)

## Testing

Testing postcodes, used with our demo API key:

![Open Postcodes Testing](https://raw.github.com/OpenPostcodes/postcodes-jquery/master/example/testing.png)

## License
MIT

