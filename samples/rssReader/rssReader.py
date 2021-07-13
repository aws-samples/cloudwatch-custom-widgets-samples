# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: simple RSS reader
import base64 
import os
from urllib.request import urlopen
import json
import xml.etree.ElementTree as ET
from io import StringIO

DOCS = """
## RSS Reader
Reads and displays content of an RSS feed.

### Widget parameters
Param | Description
---|---
**url** | The URL of the RSS feed
**entryTag** | The XML tag of the element in the feed containing each "news" entry
**fields** | An array of field names to extract and display from each entry

### Example parameters
``` yaml
url: http://status.aws.amazon.com/rss/cloudwatch-us-east-1.rss
entryTag: ./channel/item
fields: [ title, pubDate, description ]
```"""

CSS = """
<style>
    h2 { 
        font-size: 16px !important;
        font-weight: bold !important;
    }
    .panel {
        border: 1px solid #999;
        background-color: #fffff0;
        padding: 10px;
        margin: 5px 5px 10px 5px;
        border-radius: 10px;
        box-shadow: 0 8px 6px -6px #bbb;
    }
</style>"""

def parse_xml(xml):
    it = ET.iterparse(StringIO(xml))
    for _, el in it:
        prefix, has_namespace, postfix = el.tag.partition('}')
        if has_namespace:
            el.tag = postfix  # strip all namespaces
    root = it.root
    return root

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    url = event['url']
    entryTag = event['entryTag']
    fields = event['fields']
    data = urlopen(url).read()
    xml = data.decode('utf-8')
    rss = parse_xml(xml)
    html = ''
    
    for entry in rss.findall(entryTag):
        html += '<div class="panel">'
        for index, field  in enumerate(fields):
            split = field.split(".")
            if len(split) == 2:
                value = entry.find(split[0])
                if value is not None:
                    attr = value.get(split[1])
                    if attr is not None:
                        html += f"<b>{split[0]}:</b> {attr}<br>"
            else:
                value = entry.find(field)
                if value  is not None and value.text is not None:
                    # first field is the title
                    if index == 0:
                        html += f"<h2>{value.text}</h2><br>"
                    else:
                        html += f"{value.text}<br>"
        html += '</div>'

    return CSS + html