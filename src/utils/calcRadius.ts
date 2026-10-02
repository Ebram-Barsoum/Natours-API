export enum DistanceUnit {
    KM = 'km',
    MI = 'mi',
    M = 'm'
}

export default function calcRadius(distance: number, unit: DistanceUnit): number {
    // we need to convert the distance to radians to calculate the radius of the sphere around the point
    //  by which we want to search
    // so we need to divide the distance by the radius of the earth
    // 6378.1 is the radius of the earth in kilometers
    // 6378.1 * 1000 is the radius of the earth in meters
    // 6378.1 * 1000 * 0.621371 is the radius of the earth in miles

    if (unit === 'km') {
        return distance / 6378.1;
    } else if (unit === 'mi') {
        return distance / (6378.1 * 0.621371);
    } else {
        return distance / 6378.1 * 1000;
    }
}