## Highschool Dropouts vizualisation (NMS-HS)

This is a visualisation that was developed for addendum's [article](https://www.addendum.org/neue-mittelschule/gekommen-um-wieder-zu-gehen/) on comparing the dropout rates in newer (Neue Mittelschule) and the older (Hauptschule) highschool system.

It was built using regl.js, basic js and some css magic. Because of a very short deadline and the very specific nature of the project we were unable to develop it as a standalone library.

Because it was going to be embedded through an iframe we built it as a standlone website and didn't bother with packaging and other fancy tools. Maybe in the future if we ever need such a visualisation again, we would use parts of the code and turn it into a configurable library, but for now we will leave it as it is. The most important code is found in index.js where the shaders and logic live.

## URL Get Parameters

We wanted some form of configurability while embedded so I listen to various get parameters.

- **autostart**: true | false
    - Start the animation on document load?
    - default: **false**

- **lockfilters**: true | false
    - Lock filters or not. If locked you cannot change them anymore.
    - Default: **false**

- **flipstats**: true | false
    - By default the absolute values are show on top. If you flip it the percentages will go on top.
    - default: **false**

- **lang**: jeder | deutscher | nichtdeutscher
- **schooltype**: Schule mit Matura-Abschluss | Höheren Schule (BHS) | HTL | HAK | HLW | BORG | AHS-Oberstufe | Lehrerbildenden Schule
- **urbanity**: Österreich gesamt | Großstädten | Kleinstädten | ländlichen Gemeinden
- **year**: allen Jahren seit '13 | 2013/14 | 2014/15 | 2015/16 | 2016/17

- **pointwidth**: [integer]
    - How big is each particle.
    - default = **18**

**pointspersecond** <-> **speed** have a visually inverse relationship. If the speed is higher you will need to show more points per second to have the same visually density as with less points on a slower speed.

- **pointspersecond**: [integer]
    - How many points to add to the chart per second.
    - default = **100**

- **minspeed**: [integer]
    - The minimum speed at which a point should traverse
    - default = **1**
- **maxspeed**: [integer]
    - The max speed at which a point should traverse
    - default = **3**

## License

Attribution 4.0 International (CC BY 4.0)

You are free to: - Share — copy and redistribute the material in any medium or format - Adapt — remix, transform, and build upon the material - for any purpose, even commercially. - The licensor cannot revoke these freedoms as long as you follow the license terms.

Under the following terms: Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.
