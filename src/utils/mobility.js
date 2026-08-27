// MOBILITE RUTIN MOTORU (Faz 5f) — on/post antrenman akislari + poza sayaci.
// Saf fonksiyonlar + veri: UI (MobilityView) bunu kullanir.

/**
 * Poz tanimi: id, ad anahtari (i18n), sure (sn), hedef bolge anahtari.
 * side: 'both' -> iki taraf ayri sayilir, 'single' -> tek.
 */
export const POSES = {
    neckSide:      { id: 'neckSide',      dur: 30, side: 'both',   focus: 'neck' },
    shoulderRoll:  { id: 'shoulderRoll',  dur: 30, side: 'single', focus: 'shoulders' },
    armCircle:     { id: 'armCircle',     dur: 30, side: 'single', focus: 'shoulders' },
    catCow:        { id: 'catCow',        dur: 40, side: 'single', focus: 'spine' },
    worldGreatest: { id: 'worldGreatest', dur: 40, side: 'both',   focus: 'hips' },
    hipFlexor:     { id: 'hipFlexor',     dur: 40, side: 'both',   focus: 'hips' },
    hamReach:      { id: 'hamReach',      dur: 40, side: 'both',   focus: 'hamstrings' },
    quadStretch:   { id: 'quadStretch',   dur: 35, side: 'both',   focus: 'quads' },
    ankleCircle:   { id: 'ankleCircle',   dur: 25, side: 'both',   focus: 'calves' },
    thoracicOpen:  { id: 'thoracicOpen',  dur: 40, side: 'both',   focus: 'chest' },
    childPose:     { id: 'childPose',     dur: 45, side: 'single', focus: 'spine' },
    deepSquat:     { id: 'deepSquat',     dur: 40, side: 'single', focus: 'hips' },
    couchStretch:  { id: 'couchStretch',  dur: 45, side: 'both',   focus: 'quads' },
    doorPec:       { id: 'doorPec',       dur: 40, side: 'both',   focus: 'chest' },
    latLean:       { id: 'latLean',       dur: 35, side: 'both',   focus: 'back' }
};

/**
 * Hazir akislar. warmup = antrenman oncesi dinamik, cooldown = sonrasi statik.
 */
export const FLOWS = {
    warmup: {
        id: 'warmup',
        poses: ['neckSide', 'shoulderRoll', 'armCircle', 'catCow', 'worldGreatest', 'hipFlexor', 'ankleCircle', 'deepSquat']
    },
    cooldown: {
        id: 'cooldown',
        poses: ['childPose', 'couchStretch', 'doorPec', 'hamReach', 'quadStretch', 'latLean', 'thoracicOpen']
    },
    fullBody: {
        id: 'fullBody',
        poses: ['neckSide', 'shoulderRoll', 'catCow', 'worldGreatest', 'hipFlexor', 'hamReach', 'deepSquat', 'childPose']
    },
    lowerBody: {
        id: 'lowerBody',
        poses: ['hipFlexor', 'hamReach', 'quadStretch', 'ankleCircle', 'deepSquat', 'couchStretch']
    },
    upperBody: {
        id: 'upperBody',
        poses: ['neckSide', 'shoulderRoll', 'armCircle', 'thoracicOpen', 'doorPec', 'latLean', 'childPose']
    }
};

/**
 * Akisi poz/side adimlarina acar.
 * Ornek: neckSide (both) -> [{poseId, side:'L'},{poseId, side:'R'}]
 * @returns {{poseId:string, side:'L'|'R'|'-', seconds:number}[]}
 */
export function buildSteps(flowId) {
    const flow = FLOWS[flowId];
    if (!flow) return [];
    const out = [];
    flow.poses.forEach(pid => {
        const p = POSES[pid];
        if (!p) return;
        if (p.side === 'both') {
            out.push({ poseId: pid, side: 'L', seconds: p.dur });
            out.push({ poseId: pid, side: 'R', seconds: p.dur });
        } else {
            out.push({ poseId: pid, side: '-', seconds: p.dur });
        }
    });
    return out;
}

/** Akisin toplam suresi (sn). */
export function flowDuration(flowId) {
    return buildSteps(flowId).reduce((s, x) => s + x.seconds, 0);
}

/**
 * Gecen sureden mevcut adimi bulur (HIIT currentSegment ile ayni desen).
 * @returns {{step:number, poseId:string, side:string, seconds:number, secondsLeft:number}|null}
 */
export function currentStep(steps, elapsed) {
    if (!Array.isArray(steps) || steps.length === 0) return null;
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        if (elapsed < acc + st.seconds) {
            return { step: i, poseId: st.poseId, side: st.side, seconds: st.seconds, secondsLeft: st.seconds - (elapsed - acc) };
        }
        acc += st.seconds;
    }
    const last = steps[steps.length - 1];
    return { step: steps.length - 1, poseId: last.poseId, side: last.side, seconds: last.seconds, secondsLeft: 0 };
}
