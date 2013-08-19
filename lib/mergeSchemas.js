var _ = require('underscore'),
  fs = require('fs');

module.exports = function (folder, contents) {

  function iterate(root, obj, parentKey, parentObj) {
    _.each(obj, function (val, key) {

      if (key.match(/oneOf/)) {
        // Parse the oneOf tag array
        _.each(val, function (val2, key2) {
          iterate(root, val2, key2, val);
        });

      } else {

        if (key.match(/\$ref/)) {

          if (val.match(/#\/definitions\/.*/)) {
            console.log("parsing local subschema " + val.substring(14))
            // Return a new iterator into the local sub schema and bind that to the parents key
            parentObj[parentKey] = iterate(root, root["definitions"][val.substring(14)], parentKey, parentObj);
          } else  {


            // The $ref keys value should be a path to the sub schema, get it.
            var filePath = folder + parentObj[parentKey][key];

            // Check path exists
            if (fs.existsSync(filePath)) {

              // Get the subSchema
              var subSchema = JSON.parse(fs.readFileSync(filePath, 'utf8'));

              // Return a new iterator into the sub schema and bind that to the parents key
              parentObj[parentKey] = iterate(root, subSchema, parentKey, parentObj);

            }
          }
        }
      }

      // If a new object (but not an array) is encountered.
      if (typeof val === 'object' && !val.length) {

        // Iterate down into that
        iterate(root, val, key, obj);

      }

    });

    return obj;

  }

  contents.forEach(function (val, key) {

    // For each schema that is mapped into the contents iterate down into
    // it and look for any $ref keys that will point to sub schemas
    contents[key] = iterate(JSON.parse(val), JSON.parse(val));

  });

  return contents;

};
