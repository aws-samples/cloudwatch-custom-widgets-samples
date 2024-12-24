// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: call any read-only AWS API and return raw results in JSON
const DOCS = `
## Make an AWS Call
Calls any (read-only) AWS API and displays the result as JSON.

### Widget parameters
Param | Description
---|---
**service** | The name of the AWS service to call, e.g. **EC2** or **CloudWatch**
**api** | The API name to call, e.g. **DescribeInstances** or **ListDashboards**
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
    const api = event.api || 'ListDashboards';
    const region = event.region || process.env.AWS_REGION;
    const params = event.params || {};

    try {
        const { [service + 'Client']: ServiceClient } = await import(`@aws-sdk/client-${service.toLowerCase()}`);

        if (!ServiceClient) {
            throw new Error(`Unknown AWS service ${service}`);
        }

        const client = new ServiceClient({ region });

        const { [api.toUpperCase() + 'Command']: Command } = await import(`@aws-sdk/client-${service.toLowerCase()}`);
        const command = new Command(params);

        const response = await client.send(command);

        return response;
    } catch (error) {
        console.error(`Error calling AWS API: ${error.message}`);
        return { error: error.message };
    }
};
