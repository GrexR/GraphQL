import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as main from "./main.js";

export function displayError(message) {
    let errorWrapper = document.querySelector(".error-wrapper");
    if (!errorWrapper) {
        return;
    }
    errorWrapper.style.display = "block";
    errorWrapper.innerHTML = message;
}

async function RequestLogin(basicAuth) {
    const response = await fetch(`https://01.kood.tech/api/auth/signin`, {
        method: "POST",
        headers: {
            'Authorization': `Basic ${basicAuth}`
        },

    });
    return response;
}
const data = JSON.stringify({
    query: `query {
            transaction(order_by: {createdAt: asc} where:{attrs: {_eq: {}} _and:[{path:{_nlike: "%piscine%"}}, {type: {_eq: "xp"}} ]}  ) {
              amount
              createdAt
            }
      }`,
});

const dataQueryID = JSON.stringify({
    query: `query {
        user {
            id
            transactions_aggregate (where:{attrs: {_eq: {}} _and:[{path:{_nlike: "%piscine%"}}, {type: {_eq: "xp"}} ]}){
              aggregate {
               count
                sum{
                  amount
                }
              }
            }
          }
      }`,
});

const auditDataQuery = JSON.stringify({
    query: `
    fragment aggregation on transaction_aggregate{
        aggregate {
          sum {
            amount
          }
        }
      }
      query ($toIgnore: String!) {
        down: transaction_aggregate( where:{path:{_nlike: $toIgnore} _and:[{type: {_eq: "down"}} ]} ) {
         ...aggregation
        }
        up: transaction_aggregate(where:{path:{_nlike: $toIgnore} _and:[{type: {_eq: "up"}} ]} ) {
          ...aggregation
        }
      }
    `,
    variables: { "toIgnore": "%piscine%" }
});

const piscineDataQuery = JSON.stringify({
    query: `query {
        progress(where: {path: {_like: "%piscine-go/%/%", _nlike: "%exam%"}}, order_by: {createdAt: asc}) {
          userLogin
          grade
          isDone
          path
        }
      }`,
});

async function RequestData(JWT) {
    const response = await fetch(`https://01.kood.tech/api/graphql-engine/v1/graphql`, {
        method: "POST",
        body: data,
        headers: {
            'Authorization': `Bearer ${JWT}`
        },

    });
    return response;
}



async function RequestUserID(JWT) {
    const response = await fetch(`https://01.kood.tech/api/graphql-engine/v1/graphql`, {
        method: "POST",
        body: dataQueryID,
        headers: {
            'Authorization': `Bearer ${JWT}`
        },

    });
    return response;
}


async function RequestAuditData(JWT) {
    const response = await fetch(`https://01.kood.tech/api/graphql-engine/v1/graphql`, {
        method: "POST",
        body: auditDataQuery,
        headers: {
            'Authorization': `Bearer ${JWT}`
        },

    });
    return response;
}

async function RequestPiscineData(JWT) {
    const response = await fetch(`https://01.kood.tech/api/graphql-engine/v1/graphql`, {
        method: "POST",
        body: piscineDataQuery,
        headers: {
            'Authorization': `Bearer ${JWT}`
        },

    });
    return response;
}

export function displayUserData() {
    RequestUserID(getJWT()).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Something went wrong');
    })
        .then((data) => {
            //document.querySelector("span").innerHTML += ` ID:${data["data"]["user"][0].id}`;
            let objectData = [
                {
                    title: "ID",
                    text: `${data["data"]["user"][0].id}`
                },
                {
                    title: "Total XP",
                    text: `${Math.ceil(data["data"]["user"][0]["transactions_aggregate"]["aggregate"]["sum"]["amount"] * 0.001)} KB`
                },
                {
                    title: "Total projects done",
                    text: `${(data["data"]["user"][0]["transactions_aggregate"]["aggregate"]["count"])}`
                }
            ]
            for (let i = 1; i <= 3; i++) {
                let card = document.querySelector(`#card${i}`)
                let h3 = card.querySelector("h3")
                let p = card.querySelector("p")
                h3.innerHTML = objectData[i-1].title
                p.innerHTML = objectData[i-1].text
            }

            handleData();
        })
        .catch((error) => {
            displayError(error);
            deleteJWT()
            main.navigateTo("/login")
            console.log("fail: ", error);
        });
}

export function handleLogin(username = "", password = "") {
    let basicAuth = btoa(`${username}:${password}`);
    RequestLogin(basicAuth).then((response) => {
        if (response.ok) {
            return response.json();
        }
        if (response.status === 401) {
            throw new Error('The credentials you entered are invalid');
        } else {
            throw new Error('Something went wrong');
        }
    })
        .then((data) => {
            setJWT(data);
            main.navigateTo("dashboard")
        })
        .catch((error) => {
            displayError(error);
            console.log("fail: ", error);
        });
}

export function handleData() {
    let JWT = getJWT();
    if (!JWT) { return; }
    RequestData(JWT).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Something went wrong' + response.status);
    })
        .then((data) => {
            addDivider("User XP line graph");
            let sum = 0;
            data = data["data"]["transaction"];
            data.forEach((d) => {
                d.amount = d.amount * 0.001; // convert to kB
                sum += d.amount;
                d.createdAt = new Date(d.createdAt);
            });
            let firstTimestamp = d3.min(data, d => d.createdAt);
            let lastTimestamp = d3.max(data, d => d.createdAt);
            let prev = 0;
            const width = 640;
            const height = 450;
            const marginTop = 5;
            const marginRight = 20;
            const marginBottom = 30;
            const marginLeft = 40;
            sum = Math.ceil(sum); // rounds up like intra

            // Declare the x (horizontal position) scale.
            const x = d3.scaleUtc()
                .domain([firstTimestamp, lastTimestamp])
                .range([marginLeft, width - marginRight]);

            // Declare the y (vertical position) scale.
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.amount + 19.5)])
                .range([height - marginBottom, marginTop, 20]);

            // Create the SVG container.
            const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height);

            var path = svg.selectAll("path")
                .data([0, 0])
                .enter()
                .append("path")
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", "1.5")
                .attr("stroke-miterlimit", "1");

            const line = d3.line()
                .x(d => x(d.createdAt))
                .y(d => y(d.amount));

            path.attr("d", line(data));

            // Add the x-axis.
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x));

            // Add the y-axis.
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y)
                    .tickSize(-2500))
                .selectAll(".tick line")
                .attr("opacity", 0.4);

            // Append the SVG element.
            let graphSection = document.querySelector(".graphSection");
            graphSection.append(svg.node());
            handleAuditData();
        })
        .catch((error) => {
            console.log("fail: ", error);
            // deleteJWT()
            // navigateTo("/login")
        });
}

function addDivider(text) {
    let graphSection = document.querySelector(".graphSection")
    let div = document.createElement("div");
    div.classList.add("divider");


    let span = document.createElement("span");
    span.innerHTML = text
    graphSection.append(div);
    graphSection.append(span)

}

export function handleAuditData() {
    let JWT = getJWT();
    if (!JWT) { return; }
    RequestAuditData(JWT).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Something went wrong' + response.status);
    })
        .then((data) => {
            addDivider("Audit ratio donut chart");
            data = data["data"];
            let totalDown = Math.ceil(data["down"]["aggregate"]["sum"]["amount"] * 0.001);
            let totalUp = Math.ceil(data["up"]["aggregate"]["sum"]["amount"] * 0.001);
            let totalAuditsDone = totalDown + totalUp;
            const margin = 40;
            const width = 1000;
            const height = Math.min(width, 500);
            const radius = Math.min(width, height) / 2 - margin;

            var arc = d3.arc()
                .innerRadius(radius * 0.5)         // This is the size of the donut hole
                .outerRadius(radius * 0.8);

            // Another arc that won't be drawn. Just for labels positioning
            var outerArc = d3.arc()
                .innerRadius(radius * 0.9)
                .outerRadius(radius * 0.9);

            // append the svg object to the div
            const svg = d3.select(".graphSection")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);

            const newData = { "Audits Received": totalDown, "Audits Done": totalUp };

            // Compute the position of each group on the pie:
            const pie = d3.pie()
                .value(d => d[1]);

            const color = d3.scaleOrdinal()
                .range(["#ffff00", "#00ff73"]);


            const data_ready = pie(Object.entries(newData));
            // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
            let centralText = svg.append("text")
                .attr("text-anchor", "middle");

            svg
                .selectAll('auditDonut')
                .data(data_ready)
                .join('path')
                .attr('d', arc)
                .attr('fill', d => color(d.index))
                .attr("stroke", "black")
                .style("stroke-width", "2px")
                .style("opacity", 0.7)
                .on('mouseover', function (d, i) {
                    d3.select(this).transition()
                        .duration('50')
                        .style('opacity', "1");

                    centralText
                        .text(`${Math.round((newData[i.data[0]] / totalAuditsDone) * 100 * 10) / 10}%`)
                        .attr('fill', color(i.index));
                })

                .on('mouseleave', function (d, i) {
                    d3.select(this).transition()
                        .duration('50')
                        .style('opacity', "0.7");
                    centralText
                        .text(``);
                });



            svg
                .selectAll('allPolylines')
                .data(data_ready)
                .enter()
                .append('polyline')
                .attr("stroke", "black")
                .style("fill", "none")
                .attr("stroke-width", 1)
                .attr('points', function (d) {
                    var posA = arc.centroid(d); // line insertion in the slice
                    var posB = outerArc.centroid(d); // line break: we use the other arc generator that has been built only for that
                    var posC = outerArc.centroid(d); // Label position = almost the same as posB
                    var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2; // we need the angle to see if the X position will be at the extreme right or extreme left
                    posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                    return [posA, posB, posC];
                });

            svg
                .selectAll('allLabels')
                .data(data_ready)
                .enter()
                .append('text')
                .text(function (d) {return d.data[0]; })
                .attr('transform', function (d) {
                    var pos = outerArc.centroid(d);
                    var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                    pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                    return 'translate(' + pos + ')';
                })
                .style('text-anchor', function (d) {
                    var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                    return (midangle < Math.PI ? 'start' : 'end');
                }); ``;



            handlePiscineData();

        }).catch((error) => {
            displayError(error);
            deleteJWT()
            navigateTo("/login")
            console.log("fail: ", error);
        });

}

function compareFn(a, b) { // to fix quest5 tasks being done at same time as quest6 while keeping the createdAt order
    let x = a.path.split('/');
    let x2 = b.path.split('/');
    a = x[3].split("-")[1];
    b = x2[3].split("-")[1];

    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    }
    // a must be equal to b
    return 0;
}

export function handlePiscineData() {
    let JWT = getJWT();
    if (!JWT) { return; }
    RequestPiscineData(JWT).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Something went wrong' + response.status);
    })
        .then((data) => {
            data = data["data"];
            let progress = data["progress"].sort(compareFn);

            addDivider("Go Piscine heatmap");
            let arr = [];
            const myGroups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
            const myVars = [];

            let mouseDiv = document.querySelector(".MouseHover");
            let currentDiv;
            let counter = 1;
            for (const elem of progress) { // setting up arr
                let x = elem.path.split('/');

                let foundIndex = arr.findIndex(d => d.projectName === x[4]);
                if (foundIndex && foundIndex !== -1) {
                    arr[foundIndex]["Fails"] = elem.grade === 0 ? arr[foundIndex]["Fails"] + 1 : arr[foundIndex]["Fails"];
                    arr[foundIndex]["Success"] = elem.grade === 1 ? 1 : arr[foundIndex]["Success"];
                    //arr[foundIndex]["x"] = counter;
                    arr[foundIndex]["y"] = x[3];
                    //console.log(elem.path, counter, currentDiv, x[3]);

                } else {
                    if (!myVars.find(d => d == x[3])) {
                        myVars.push(x[3]);
                    }

                    if (currentDiv !== x[3]) {
                        currentDiv = x[3];
                        counter = 1;
                    } else {
                        counter++;
                    }

                    arr.push(
                        {
                            "Fails": elem.grade === 0 ? 1 : 0,
                            "Success": elem.grade === 1 ? 1 : 0,
                            "x": counter,
                            "y": x[3],
                            "projectName": x[4]
                        });

                }
            };

            
            let mostFails = Math.max(...arr.map(o => o.Fails));

            const margin = { top: 30, right: 30, bottom: 30, left: 120 },
                width = 700 - margin.left - margin.right,
                height = 450 - margin.top - margin.bottom;

            // append the svg object to the body of the page
            const svg = d3.select(".graphSection")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Build X scales and axis:
            const x = d3.scaleBand()
                .range([0, width])
                .domain(myGroups)
                .padding(0.01);
            svg.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x));

            // Build X scales and axis:
            const y = d3.scaleBand()
                .range([height, 0])
                .domain(myVars)
                .padding(0.01);
            svg.append("g")
                .call(d3.axisLeft(y));


          
            // Build color scale
            const myColor = d3.scaleLinear()
                .range(["#ffd1d1", "#FF0000"])
                .domain([1, mostFails]);

            //Read the data


            svg.selectAll()
                .data(arr, function (d) { return d.x + ':' + d.y; })
                .join("rect")
                .attr("x", function (d) { return x(d.x); })
                .attr("y", function (d) { return y(d.y); })
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("fill", function (d) { return d.Fails === 0 && d.Success === 1 ? "#66FF00" : myColor(d.Fails); })
                .on('mouseover', function (d, i) {
                    mouseDiv.style.left = d.pageX + 'px';
                    mouseDiv.style.top = d.pageY - 100 + 'px';
                    mouseDiv.style.display = "block";
                    mouseDiv.innerText = `Project Name: ${i.projectName}\nNumber of fails: ${i.Fails}`;
                })
                .on('mouseleave', function () {
                    mouseDiv.style.display = "none";
                });




        }).catch((error) => {
            displayError(error);
            console.log("fail: ", error);
        });

}


export function getJWT() {
    return localStorage.getItem("JWT");
}

export function deleteJWT() {
    return localStorage.removeItem("JWT");
}

export function setJWT(JWT) {
    localStorage.setItem("JWT", JWT);
}


