# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: fetch a file from a URL
import base64 
import os
from urllib.request import urlopen

DOCS = """
## Fetch contents of a URL
Gets the content of a specified URL, usually a HTML page, and displays it.

### Widget parameters
Param | Description
---|---
**url** | The URL to display

### Example parameters
``` yaml
url: https://en.wikipedia.org/wiki/HTML
```"""

IMAGE_FILETYPES = ['.jpg', '.jpeg', '.bmp', '.gif', '.png' ];

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    url = event['url']
    filename, file_extension = os.path.splitext(url)
    is_image = file_extension in IMAGE_FILETYPES
    data = urlopen(url).read()
    if is_image:
        base64_image = base64.b64encode(data).decode('UTF-8')
        return f"""<img src="data:image/{file_extension[1:]};base64,{base64_image}">"""
    else:
        return data.decode('utf-8')
