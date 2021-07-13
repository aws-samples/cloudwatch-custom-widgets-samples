# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: simple echo script
DOCS = """
## Echo
A simple echo script. Anyting passed in ```echo``` parameter is returned as the content of custom widget.

### Widget parameters
Param | Description
---|---
**echo** | The content to echo back

### Example parameters
``` yaml
echo: <h1>Hello world</h1>
```"""

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    return event.get('echo', '<pre>No "echo" parameter specified</pre>')
    return f'<h1>Hello {name}</h1>'