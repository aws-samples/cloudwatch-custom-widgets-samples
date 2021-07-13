// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: fetch a file from a URL
const DOCS = `
## Fetch contents of a URL
Gets the content of a specified URL, usually a HTML page, and displays it.

### Widget parameters
Param | Description
---|---
**url** | The URL to display

### Example parameters
\`\`\` yaml
url: https://en.wikipedia.org/wiki/HTML
\`\`\`
`;

const http = require('https');
const stream = require('stream').Transform;

const IMAGE_FILETYPES = ['jpg', 'jpeg', 'bmp', 'gif', 'png' ];

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const url = event.url;    // url is the parameter to fetch
    const fileType = url.substr(url.lastIndexOf('.') + 1);
    const isImage = IMAGE_FILETYPES.includes(fileType);
    const res = await new Promise(resolve => {
        http.get(url, resolve);
    });

    // A ServerResponse is a readable stream, so you need to use the
    // stream-to-promise pattern to use it with async/await.
    let data = await new Promise((resolve, reject) => {
        let data = new stream();
        res.on('data', chunk => data.push(chunk));
        res.on('error', err => reject(err));
        res.on('end', () => resolve(data));
    });
    const dataBuffer = new Buffer(data.read());

    if (isImage) {
        return `<img src="data:image/${fileType};base64,${dataBuffer.toString('base64')}">`;
    } else {
        return dataBuffer.toString('utf-8')
    }
};
