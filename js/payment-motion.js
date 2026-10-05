const PAYMENT_POSES = Object.freeze({
  extract: { sprite:'pay-extract', hand:[86,112], duration:140 },
  present: { sprite:'pay-present', hand:[106,112], duration:180 },
  contact: { sprite:'pay-contact', hand:[112,128], duration:300 },
  retract: { sprite:'pay-present', hand:[106,112], duration:180 },
  tuck: { sprite:'pay-extract', hand:[86,112], duration:120 },
});

async function animateTerminalPayment(event) {
  const id = customerLineup[state.eventIndex];
  const asset = new Image();
  asset.src = `assets/pixel-sprites/${event.paymentAsset}.svg`;
  const poseAssets = new Map();
  for (const spec of Object.values(PAYMENT_POSES)) {
    if (poseAssets.has(spec.sprite)) continue;
    const image = new Image();
    image.src = customerPath(id, spec.sprite);
    poseAssets.set(spec.sprite,image);
  }
  try {
    await Promise.all([asset,...poseAssets.values()].map(image=>image.decode()));
  } catch {
    playPaymentSound(event.paymentType);
    await pulseState(payment, event.paymentType === 'tap' ? 'tap-processing' : 'processing', 280);
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'payment-motion';
  const pose = document.createElement('img'), prop = document.createElement('img');
  pose.className = 'payment-pose'; prop.className = 'payment-prop';
  pose.alt = ''; prop.alt = ''; overlay.setAttribute('aria-hidden','true');
  prop.src = asset.src;
  overlay.append(pose,prop);
  world.layer.append(overlay);
  const reference = PixelWorld.customer;
  const scale = reference.targetH/reference.nativeH;
  const bodyWidth = reference.nativeW*scale;
  const phone = event.paymentType === 'tap';
  const propWidth = PixelWorld.snap(bodyWidth*(phone ? .09 : .10),2);
  const propHeight = PixelWorld.snap(propWidth*(phone ? 56/32 : 40/64));
  PixelWorld.place(pose,{left:reference.x,top:reference.y,width:reference.targetH,height:reference.targetH});
  customer.classList.add('payment-hidden');
  try {
    for (const [phase,spec] of Object.entries(PAYMENT_POSES)) {
      customerPose = spec.sprite;
      pose.src = poseAssets.get(spec.sprite).src;
      overlay.dataset.phase = phase;
      PixelWorld.place(prop,{
        left:PixelWorld.snap(reference.x+spec.hand[0]*scale-propWidth/2,2),
        top:PixelWorld.snap(reference.y+spec.hand[1]*scale-propHeight,2),
        width:propWidth,height:propHeight,
      });
      if (phase === 'contact') {
        payment.classList.add(phone ? 'tap-processing' : 'processing');
        playPaymentSound(event.paymentType);
      }
      if (phase === 'retract') payment.classList.remove('tap-processing','processing');
      await sleep(spec.duration);
    }
  } finally {
    overlay.remove();
    customer.classList.remove('payment-hidden');
    payment.classList.remove('tap-processing','processing');
    customerPose = 'idle';
    render();
  }
}
