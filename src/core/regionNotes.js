export function addRegionNotes(zoneKey, structureGenerator, currentZoneX, currentZoneY) {
    const homeNoteMap = {
        '0,0': 0,
        '1,0': 1,
        '0,1': 2,
        '-1,0': 3,
        '0,-1': 4
    };
    if (homeNoteMap[zoneKey]) {
        structureGenerator.addSpecificNote(homeNoteMap[zoneKey], currentZoneX, currentZoneY);
    }

    const wildsNoteMap = {
        '3,0': 0,
        '3,1': 1,
        '4,0': 2,
        '4,1': 3,
        '4,2': 4
    };
    if (wildsNoteMap[zoneKey]) {
        structureGenerator.addSpecificNote(wildsNoteMap[zoneKey], currentZoneX, currentZoneY);
    }

    const frontierNoteMap = {
        '10,0': 0,
        '10,1': 1,
        '11,0': 2,
        '11,1': 3,
        '11,2': 4
    };
    if (frontierNoteMap[zoneKey]) {
        structureGenerator.addSpecificNote(frontierNoteMap[zoneKey], currentZoneX, currentZoneY);
    }
}
