# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: simple hello world, takes optional 'name' as a parameter
DOCS = """
## Hello World
The basic starter "hello world" widget.  Takes one optional parameter, **name**.

### Widget parameters
Param | Description
---|---
**name** | The name to greet (optional)

### Example parameters
``` yaml
name: widget developer
```"""

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    name = event.get('name', 'friend')
    return f'<h1>Hello {name}</h1>'