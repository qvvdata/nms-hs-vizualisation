function getFilteredData(lang, schooltype, urbanity, year) {
    let data = [];

    // Loop through the data and select the fields we need.
    for (let i = 0; i < DATA.length; i++) {
        var datapoint = DATA[i];

        if (datapoint['lang'] !== lang) continue;
        if (datapoint['schooltype'] !== schooltype) continue;
        if (datapoint['urbanity'] !== urbanity) continue;
        if (datapoint['year'] !== year) continue;

        data.push(datapoint);
    }

    return data;
}

function createReglDataPoints(data, minSpeed, maxSpeed) {
    var reglData = [];


    // We don't want more than 10000 particles
    // so we cut them off at 10000 and each particle will consist of more than 1 student.
    var cutoffPointParticles = 10000;
    var studentPerParticleRatio = 1;

    // Scale to randomly assigned an x pos for the point.
    // the final number is mapped to webgl coordinate system of numbers between [-1, 1]
    var xScale = linearScale([0, 1], [-0.7, 0.7]);

    var totalNms = 0;
    var totalHs = 0;
    var studentAmount = 0;
    for (let i = 0; i < data.length; i++) {
        studentAmount += data[i]['year1college'];

        if (data[i]['origin'] === 'NMS') {
            totalNms += data[i]['year1college'];
        } else {
            totalHs += data[i]['year1college'];
        }
    }

    if (studentAmount > cutoffPointParticles) {
        studentPerParticleRatio = studentAmount / cutoffPointParticles;
    }

    var totalNmsPassed = 0;
    var totalNmsNotPassed = 0;

    var totalHsPassed = 0;
    var totalHsNotPassed = 0;

    for (let i = 0; i < data.length; i++) {
        let datapoint = data[i];
        let studentsYear1 = datapoint['year1college'];
        let studentsYear2 = datapoint['year2college'];

        if (studentPerParticleRatio > 1) {
            studentsYear1 = Math.ceil(studentsYear1 / studentPerParticleRatio);
            studentsYear2 = Math.ceil(studentsYear2 / studentPerParticleRatio);
        }

        for (let j = 0; j < studentsYear1; j++) {
            if (datapoint['origin'] === 'NMS') {
                if (j < studentsYear2) {
                    totalNmsPassed++;
                } else {
                    totalNmsNotPassed++;
                }
            } else {
                if (j < studentsYear2) {
                    totalHsPassed++;
                } else {
                    totalHsNotPassed++;
                }
            }

            let obj = {
                'isNMS': (datapoint['origin'] === 'NMS') ? 1 : 0,
                'passed': (j < studentsYear2) ? 1 : 0,
                'x': xScale(Math.random()),
                'y': 0,
                'speed': Math.random() * maxSpeed + minSpeed,
                'students': studentPerParticleRatio
            }

            if (datapoint['origin'] === 'NMS') {
                obj['percentageOfTotal'] = (studentPerParticleRatio / totalNms * 100);
            } else {
                obj['percentageOfTotal'] = (studentPerParticleRatio / totalHs * 100);
            }
            reglData.push(obj);
        }
    }

    console.log('Student/particle ratio', studentPerParticleRatio);
    console.log('Total student amount', studentAmount);
    console.log('HS', totalHs, 'Passed', totalHsPassed, 'NP', totalHsNotPassed);
    console.log('NMS', totalNms, 'P', totalNmsPassed, 'NP', totalNmsNotPassed);
    return reglData;
}

