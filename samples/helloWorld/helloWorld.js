// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: simple hello world, takes optional 'name' as a parameter
const DOCS = `
## Hello World
The basic starter "hello world" widget.  Takes one optional parameter, **name**.

### Widget parameters
Param | Description
---|---
**name** | The name to greet (optional)

### Example parameters
\`\`\` yaml
name: widget developer
\`\`\`
`;

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const name = event.name || 'friend';
    return `<h1>Hello ${name}</h1>`;
};
