// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display CodeDeploy deployments
const aws = require('aws-sdk');

const CSS = '<style>td { white-space: nowrap; }</style>';

const DOCS = `## Display Code Deployments
Displays all deployments from  [CodeDeploy](https://console.aws.amazon.com/codesuite/codedeploy/deployments?region=us-east-1)

### Example parameters
\`\`\` yaml
region: ${process.env.AWS_REGION}
\`\`\`
`;

const localReadableDate = (date, event) => {
    const offsetInMinutes = event.widgetContext.timezone.offsetInMinutes;
    const localDate = new Date(date.getTime() - offsetInMinutes * 60 * 1000);
    const readableDate = localDate.toISOString().replace(/T/, ' ').replace(/[.].*/, '');
    return readableDate;
};

const roundDate = (date, roundUp, minutes) => {
    const millis = minutes * 60 *  1000;
    const dateToRoundInMillis = date.getTime() - (roundUp ? 0 : millis);
    const roundedDate = new Date(Math.round(dateToRoundInMillis / millis) * millis);
    return roundedDate;
};

async function getDeploymentIds(codeDeployClient, start, end) {
    let nextToken = null;
    let results = [];

    do {
        const args = { createTimeRange: { start, end }, nextToken };
        const result = await codeDeployClient.listDeployments(args).promise();
        nextToken = result.nextToken;
        results = results.concat(result.deployments);
    } while (nextToken);
    return results;
}

async function getDeployments(codeDeployClient, start, end) {
    const deploymentIds = await getDeploymentIds(codeDeployClient, start, end);
    let results = [];
    while (deploymentIds.length > 0) {
        const deploymentsToQuery = deploymentIds.splice(0, Math.min(deploymentIds.length, 25));
        const response = await codeDeployClient.batchGetDeployments({ deploymentIds: deploymentsToQuery }).promise();
        results = results.concat(response.deploymentsInfo);
    }

    return results;
}

function getHtmlOutput(deployments, event) {
    let result = CSS;
    if (deployments.length == 0) {
        return `${result}<p>No deployments in the selected time range</p>`;
    }

    const applicationDeployments = deployments.reduce((accumulator, currentValue) => {
        if (!accumulator.hasOwnProperty(currentValue.applicationName)) {
            accumulator[currentValue.applicationName] = [];
        }
        accumulator[currentValue.applicationName].push(currentValue);
        return accumulator;
    }, {});

    Object.keys(applicationDeployments).sort().forEach(x => {
        let deployments = applicationDeployments[x];
        deployments = deployments.sort((a, b) => a.createTime.getTime() - b.createTime.getTime());
        result = `${result}<h2>${x}</h2><table>`;
        result = `${result}<tr><th>Deployment Id</th><th>Deployment Group Name</th><th>Create Time</th><th>Complete Time</th><th>Status</th><th>Creator</th></tr>`;
        deployments.forEach(deployment => {
            result = `${result}<tr><td>${deployment.deploymentId}</td><td>${deployment.deploymentGroupName}</td>
                        <td>${localReadableDate(deployment.createTime, event)}</td><td>${localReadableDate(deployment.completeTime, event)} | <a href="#dashboards:name=${event.widgetContext.dashboardName};start=${roundDate(deployment.createTime, false, 5).toISOString()};end=${roundDate(deployment.completeTime, true, 5).toISOString()}">apply</a></td>
                        <td>${deployment.status}</td><td>${deployment.creator}</td></tr>`;
        });
        result += "</table>";
    });

    return result;
}

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;
    }
    const codeDeployClient = new aws.CodeDeploy({ region: event.region || process.env.AWS_REGION });
    const timeRange = event.widgetContext.timeRange.zoom || event.widgetContext.timeRange;
    const deployments = await getDeployments(codeDeployClient, timeRange.start / 1000, timeRange.end / 1000);
    return getHtmlOutput(deployments, event);
};