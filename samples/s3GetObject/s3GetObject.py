# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: display an object from S3 bucket
DOCS = """
## S3 Get Object
Displays the content of a file (usually HTML) stored in S3 in the current account.

This is useful for displaying dynamic content stored and updated separately from a dashboard, such as the results of a daily or hourly report.

### Widget parameters
Param | Description
---|---
**bucket** | The name of the S3 bucket owned by this account
**key** | The key of the S3 object

### Example parameters
``` yaml
bucket: custom-widget-demo-bucket
key: sample-report.html
```"""

import boto3
import json
import os

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    region = event.get('region', os.environ['AWS_REGION'])
    s3 = boto3.client('s3', region_name=region)
    result = s3.get_object(Bucket=event['bucket'], Key=event['key'])
    
    return result['Body'].read().decode('utf-8')
