// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: call any read-only AWS API and return raw results in JSON
const aws = require('aws-sdk');

const DOCS = `
## Make an AWS Call
Calls any (read-only) AWS API and displays the result as JSON.

### Widget parameters
Param | Description
---|---
**service** | The name of the AWS service to call, e.g. **EC2** or **CloudWatch**
**api** | The API name to call
**params** | The parameters to pass to the API

### Example parameters
\`\`\` yaml
service: EC2
api: describeInstances
params:
  Filters:
  - Name: instance-state-name
    Values:
    - running
\`\`\`
`;

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const service = event.service || 'CloudWatch';
    const api = event.api || 'listDashboards';
    const region = event.region || process.env.AWS_REGION;
    const params = event.params || {};

    if (!aws[service]) {
        throw `Unknown AWS service ${service}`;
    }

    const client = new aws[service]({ region });

    if (!client[api]) {
        throw `Unknown API ${api} for AWS service ${service}`;
    }

    return await client[api](params).promise();
};