// dependencies
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true }); // Enable ImageMagick integration.
var util = require('util');

// constants
var MAX_WIDTH  = 100;
var MAX_HEIGHT = 100;

// get reference to S3 client 
var s3 = new AWS.S3();
 
exports.handler = function(event, context) {
  // Read options from the event.
  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
  var bucket = event.Records[0].s3.bucket.name;
  var key    = event.Records[0].s3.object.key;

  console.log('Got', bucket, key);
  // Sanity check: validate that source and destination are different buckets.
  if (key.substring(0, 2) !== 'o/') {
    console.error('Image must be uploaded into the o folder.');
    return;
  }

  // Infer the image type.
  var typeMatch = key.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.error('unable to infer image type for key ' + key);
    return;
  }
  var imageType = typeMatch[1];
  if (imageType != "jpg" && imageType != "png") {
    console.log('skipping non-image ' + key);
    return;
  }

  download(bucket, key, function (err, response) {
      console.log('Downloaded', err, response);
    if (err) {
      console.error('Download error', err);
      return;
    } else {
      var contentType = response.ContentType;
      tranform(response.Body, contentType, function (err, result) {
        console.log('Transformed', err, result);
        if (err) {
          console.error('Transform error', err);
          return;
        } else {
          upload(contentType, result, function (err, resp) {
            console.log('Uploaded', err, resp);
            if (err) {
              console.error('Upload error', err);
              return;
            } else {
              console.log('Successfully resized ' + bucket + '/' + key);
              context.done();
            }
          });
        }
      });
    }
  });

  function download (bucket, key, callback) {
    // Download the image from S3 into a buffer.
    s3.getObject({
      Bucket: bucket,
      Key: key },
    callback);
  }

  function tranform (imageBuffer, imageType, callback) {
    console.log('transforming');
    // gm(imageBuffer).size(function(err, size) {
    //   console.log('Now its', err, size);
    //   // Infer the scaling factor to avoid stretching the image unnaturally.
    //   var scalingFactor = Math.min(
    //     MAX_WIDTH / size.width,
    //     MAX_HEIGHT / size.height
    //   );
    //   var width  = scalingFactor * size.width;
    //   var height = scalingFactor * size.height;
    //   console.log('Resizing to', width, height);
    //   // Transform the image buffer in memory.
    //   this
    //     .resize(width, height)
    //     .toBuffer(imageType, callback);
    // });
    //.crop(width, height, x, y)
    gm(imageBuffer)
    .resize(650)
    .toBuffer(imageType, callback);
  }

  function upload (contentType, body, callback) {
    // Stream the transformed image to a different S3 bucket.
    s3.putObject({
      Bucket: bucket,
      Key: 'r/' + key,
      Body: body,
      ContentType: contentType
    },
    callback);
  }
};