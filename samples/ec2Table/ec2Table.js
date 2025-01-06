// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display EC2 Instances by CPU Utilization
const { EC2Client, DescribeInstancesCommand, RebootInstancesCommand } = require("@aws-sdk/client-ec2");
const { CloudWatchClient, GetMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

const DOCS = `## EC2 Table
Displays top running EC2 instances by CPU Utilization.

### Example parameters
\`\`\` yaml
maxInstances: 10
\`\`\`
`;

async function getInstances(ec2) {
    let NextToken = null;
    let instances = [];

    do {
        const args = { Filters: [ { Name: 'instance-state-name', Values: [ 'running' ]} ], NextToken };
        const command = new DescribeInstancesCommand(args);
        const result = await ec2.send(command);
        NextToken = result.NextToken;
        result.Reservations.forEach(res => {
            instances = instances.concat(res.Instances);
        });
    } while (NextToken);

    return instances;
}

async function reboot(ec2, instanceId) {
    try {
        const command = new RebootInstancesCommand({ InstanceIds: [ instanceId ] });
        await ec2.send(command);
        return `Reboot was successfully trigger on the following instances: <b>${instanceId}</b>.`;
    } catch (e) {
        return `Error rebooting instance. Note that the custom widget Lambda function's IAM role requires <code>ec2:rebootInstances</code> permission`;
    }
}

async function addCpu(cw, instances, StartTime, EndTime) {
    const Period = Math.floor((EndTime.getTime() - StartTime.getTime()) / 1000)
    const metrics = instances.map((instance, i) => {
        return {
            Id: `i${i}`,
            MetricStat: { Metric: {
                    Namespace: 'AWS/EC2', MetricName: 'CPUUtilization',
                    Dimensions: [ { Name: 'InstanceId', Value: instance.InstanceId } ]
                },
                Stat: 'Average', Period
            }
        };
    });
    for (let i = 0; i < metrics.length; i += 500) {
        const command = new GetMetricDataCommand({ MetricDataQueries: metrics.slice(i, i + 500), StartTime, EndTime});
        const result = await cw.send(command);
        result.MetricDataResults.forEach(metric => {
            const index = parseInt(metric.Id.slice(1));
            instances[index].cpu = metric.Values.pop();
        });
    }
}

function getHtmlOutput(instances, region, event, context) {
    instances = instances.filter(i => i.cpu !== undefined).sort((i1, i2) => i1.cpu = i2.cpu);
    if (instances.length == 0) {
        return `<p>No running instances found reporting cpu for time period</p>`;
    }
    if (event.maxInstances) {
        instances = instances.slice(0, event.maxInstances);
    }

    const header = '<tr><th>Name</th><th>Instance ID</th><th>Instance type</th><th>Availability Zone</th><th>CPU</th><th>Action</th></tr>'
    const rows = instances.map(i => {
        const nameTag = i.Tags.find(tag => tag.Key === 'Name');
        const name = nameTag ? nameTag.Value : '';
        return `<tr><td>${name}</td>
                    <td><a href="/ec2/v2/home?region=${region}#InstanceDetails:instanceId=i-0417f2bd16850f253" target=_blank>${i.InstanceId}</a></td><td>${i.InstanceType}</td>
                    <td>${i.Placement.AvailabilityZone}</td><td>${i.cpu.toFixed(1)}%</td>
                    <td>
                        <a class="btn" style="submit">Reboot</a>
                        <cwdb-action action="call" display="popup" endpoint="${context.invokedFunctionArn}" 
                            confirmation="Are you sure you want to reboot '${i.InstanceId}'?">
                                { "action": "Reboot", "instanceId": "${i.InstanceId}" }</cwdb-action>
                    </td></tr>`;
    }).join('');

    return `<table>${header}${rows}</table>`;
}

exports.handler = async (event, context) => {
    if (event.describe) {
        return DOCS;
    }
    const widgetContext = event.widgetContext;
    const timeRange = widgetContext.timeRange.zoom || widgetContext.timeRange;
    const StartTime = new Date(timeRange.start);
    const EndTime = new Date(timeRange.end);
    const region = event.region || process.env.AWS_REGION;
    const ec2 = new EC2Client({ region });
    const cw = new CloudWatchClient({ region })

    if (event.action === 'Reboot') {
        return await reboot(ec2, event.instanceId);
    } else {
        const instances = await getInstances(ec2);
        await addCpu(cw, instances, StartTime, EndTime);
        return getHtmlOutput(instances, region, event, context);
    }
};
