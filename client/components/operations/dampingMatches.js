function getDampingMatches(bundle) {
    if (!bundle.measurements || !bundle.measurements.length || bundle.measurements.length < 2) {
        return;
    }
    var measurementsA = getMeasurementsForLocation(bundle, bundle.locationA);
    var measurementsB = getMeasurementsForLocation(bundle, bundle.locationB);

    if (!measurementsA || !measurementsB) {
        return;
    }
    var measurementMatches = [];

    if (measurementsA.length <= measurementsB.length) {
        measurementMatches = measurementsA.map(measureA => {

            var matchMeasureB = measurementsB.map(measureB => ({
                measure: measureB,
                diff: Math.abs(moment(measureA.date).diff(measureB.date, 'minutes'))
            })).sort((a, b) => a.diff - b.diff)[0];
            var calculatedDate = getAverageDate(measureA.date, matchMeasureB.measure.date)
            return {
                measurementA: measureA,
                measurementB: matchMeasureB.measure,
                timeDiff: matchMeasureB.diff,
                AtoBDamping: matchMeasureB.measure.rxValue - measureA.txValue,
                BtoADamping: measureA.rxValue - matchMeasureB.measure.txValue,
                dateA: measureA.date,
                dateB: matchMeasureB.measure.date,
                actualDate: calculatedDate.averageDate,
                deltaHours: calculatedDate.delta
            }
        })
    } else {
        measurementMatches = measurementsB.map(measureB => {

            var matchMeasureA = measurementsA.map(measureA => ({
                measure: measureA,
                diff: Math.abs(moment(measureB.date).diff(measureA.date, 'minutes'))
            })).sort((a, b) => a.diff - b.diff)[0];

            var calculatedDate = getAverageDate(matchMeasureA.measure.date, measureB.date)
            return {
                measurementA: matchMeasureA.measure,
                measurementB: measureB,
                timeDiff: matchMeasureA.diff,
                AtoBDamping: measureB.rxValue - matchMeasureA.measure.txValue,
                BtoADamping: matchMeasureA.measure.rxValue - measureB.txValue,
                dateA: matchMeasureA.measure.date,
                dateB: measureB.date,
                actualDate: calculatedDate.averageDate,
                deltaHours: calculatedDate.delta
            }
        })
    }
    return measurementMatches.sort((a, b) => moment(b.actualDate) - moment(a.actualDate));
}


function getMeasurementsForLocation(bundle, location) {
    var measurements = bundle.measurements
        .sort((a, b) => b.date - a.date)
        .filter(o => o.location === location);

    return measurements;
}


function getAverageDate(dateA, dateB) {

    var date1 = moment(dateA),
        date2 = moment(dateB);

    var duration = moment.duration(date2.diff(date1));
    duration = duration.asHours() / 2;
    if (date1 <= date2) {
        return {
            averageDate: date1.add(duration, 'hours'),
            deltaHours: parseInt(duration * 2)
        }
        
    } else {
        return {
            averageDate: date2.add(duration, 'hours'),
            deltaHours: parseInt(duration * 2)
        }
    }
}
export { getDampingMatches, getAverageDate };
