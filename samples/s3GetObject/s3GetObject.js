// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display an object from S3 bucket
const DOCS = `
## S3 Get Object
Displays the content of a file (usually HTML) stored in S3 in the current account.

This is useful for displaying dynamic content stored and updated separately from a dashboard, such as the results of a daily or hourly report.

### Widget parameters
Param | Description
---|---
**bucket** | The name of the S3 bucket owned by this account
**key** | The key of the S3 object

### Example parameters
\`\`\` yaml
bucket: custom-widget-demo-bucket
key: sample-report.html
\`\`\`
`;

const aws = require('aws-sdk');

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const region = event.region || process.env.AWS_REGION;
    const params = {
            Bucket: event.bucket,
            Key: event.key
        };
    const s3 = new aws.S3({ region });
    const result = await s3.getObject(params).promise();

    return result.Body.toString();
};
