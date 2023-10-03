import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function darkness(args) {  //redesign? Template macro?
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (args[0] === "on") {
        let templateData = {
            t: "circle",
            user: game.user.id,
            distance: 15,
            direction: 0,
            x: 0,
            y: 0,
            fillColor: game.user.color,
            flags: { "midi-srd": { Darkness: { ActorId: actor.id } } }
        };

        Hooks.once("createMeasuredTemplate", async (template) => {
            let radius = canvas.grid.size * (template.document.distance / canvas.grid.grid.options.dimensions.distance)
            circleWall(template.document.x, template.document.y, radius)

            await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
        });
        MidiSRDHelpers._createTemplate(templateData, actor)

        async function circleWall(cx, cy, radius) {
            let data = [];
            const step = 30;
            for (let i = step; i <= 360; i += step) {
                let theta0 = Math.toRadians(i - step);
                let theta1 = Math.toRadians(i);

                let lastX = Math.floor(radius * Math.cos(theta0) + cx);
                let lastY = Math.floor(radius * Math.sin(theta0) + cy);
                let newX = Math.floor(radius * Math.cos(theta1) + cx);
                let newY = Math.floor(radius * Math.sin(theta1) + cy);

                data.push({
                    c: [lastX, lastY, newX, newY],
                    move: CONST.WALL_MOVEMENT_TYPES.NONE,
                    sense: CONST.WALL_SENSE_TYPES.NORMAL,
                    dir: CONST.WALL_DIRECTIONS.BOTH,
                    door: CONST.WALL_DOOR_TYPES.NONE,
                    ds: CONST.WALL_DOOR_STATES.CLOSED,
                    flags: { "midi-srd": { Darkness: { ActorId: actor.id } } }
                });
            }
            await canvas.scene.createEmbeddedDocuments("Wall", data)
        }
    }

    if (args[0] === "off") {
        async function removeWalls() {
            let darkWalls = canvas.walls.placeables.filter(w => w.document.flags["midi-srd"]?.Darkness?.ActorId === actor.id)
            let wallArray = darkWalls.map(function (w) {
                return w.document._id
            })
            await canvas.scene.deleteEmbeddedDocuments("Wall", wallArray)
        }
        removeWalls()
    }
}