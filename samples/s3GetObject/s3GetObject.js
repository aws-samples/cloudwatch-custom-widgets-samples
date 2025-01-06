// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display an object from S3 bucket
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

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

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;
    }

    const region = event.region || process.env.AWS_REGION;
    const params = {
        Bucket: event.bucket,
        Key: event.key
    };

    const s3Client = new S3Client({ region });
    const command = new GetObjectCommand(params);

    const response = await s3Client.send(command);
    try {
        const bodyContents = await response.Body.transformToString();
        return bodyContents;
    } catch (e) {
        console.error(e);
        return `Error fetching S3 object: ${e.message}`;
    }
};
