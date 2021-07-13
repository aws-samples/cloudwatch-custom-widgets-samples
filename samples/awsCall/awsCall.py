# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: call any read-only AWS API and return raw results in JSON
import boto3
import json
import os
import re

DOCS = """
## Make an AWS Call
Calls any (read-only) AWS API and displays the result as JSON.

### Widget parameters
Param | Description
---|---
**service** | The name of the AWS service to call, e.g. **EC2** or **CloudWatch**
**api** | The API name to call
**params** | The parameters to pass to the API

### Example parameters
``` yaml
service: EC2
api: describeInstances
params:
  Filters:
  - Name: instance-state-name
    Values:
    - running
```"""

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    service = event.get('service', 'cloudwatch').lower()
    apiRaw = event.get('api', 'list_dashboards')
    api = re.sub(r'(?<!^)(?=[A-Z])', '_', apiRaw).lower()  # Convert to snakecase in case it's in CamelCase
    region = event.get('region', os.environ['AWS_REGION'])
    params = event.get('params', {})
    client = boto3.client(service)
    
    try:
        apiFunc = getattr(client, api)
        result = apiFunc(**params)
        return json.dumps(result, sort_keys=True, default=str)        
    except AttributeError:
        return f"api '{api}' not found for service '{service}'"
