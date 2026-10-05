const assert = require('node:assert/strict');
const world = require('../js/pixel-world.js');
const {generate} = require('../js/shift-engine.js');

for (const [sprite, spec] of Object.entries(world.sprites)) {
  const size = world.size(sprite);
  assert.equal(size.height, spec.targetH);
  assert.ok(Math.abs(size.width - spec.nativeW / spec.nativeH * size.height) <= .5);
  assert.ok(size.foot <= size.height);
  const single = world.layout([{sprite}])[0];
  if (size.width * 2 + 4 <= 60) {
    const pair = world.layout([{sprite}, {sprite}]);
    for (const entry of pair) assert.equal(entry.height, single.height);
  }
}
for (let seed = 0; seed < 500; seed++) {
  for (const order of generate(seed)) {
    const layout = world.layout(order.items);
    layout.forEach((box, i) => {
      Object.values(box).forEach(value => assert.ok(Number.isInteger(value)));
      assert.ok(box.x >= 325 && box.x + box.width <= 385);
      if (i) assert.ok(box.x >= layout[i - 1].x + layout[i - 1].width + 4);
    });
  }
}
assert.throws(() => world.layout(Array(5).fill({sprite:'bento'})), RangeError);
const frames = world.frames([{t:0,x:0,y:0},{t:.4,x:31,y:-13},{t:.6,x:31,y:-13},{t:1,x:80,y:23}], 540);
assert.equal(frames[0].offset, 0);
assert.equal(frames.at(-1).offset, 1);
for (const frame of frames) {
  frame.translate.split(' ').forEach(value => assert.equal(Math.abs(parseFloat(value) % 2), 0));
  assert.equal(frame.easing, 'steps(1, end)');
}
assert.equal(frames.find(f=>f.offset===.4).translate, frames.find(f=>f.offset===.6).translate);
const properties = [];
world.place({style:{setProperty:(key,value)=>properties.push([key,value])}}, {left:2.6,top:4.1,width:8,height:12,right:99,bottom:99});
assert.deepEqual(properties, [['left','3px'],['top','4px'],['width','8px'],['height','12px']]);
console.log('PASS: fixed sprite sizes; 500 shifts; integer lanes; snapped motion/hold; placement boundary');
