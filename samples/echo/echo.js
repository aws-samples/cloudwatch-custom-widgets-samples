// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: simple echo script
const DOCS = `
## Echo
A simple echo script. Anyting passed in \`\`\`echo\`\`\` parameter is returned as the content of custom widget.

### Widget parameters
Param | Description
---|---
**echo** | The content to echo back

### Example parameters
\`\`\` yaml
echo: <h1>Hello world</h1>
\`\`\`
`;

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    return event.echo || '<pre>No "echo" parameter specified</pre>';
};
