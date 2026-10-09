(() => {
  const root = document.documentElement;
  const immersive = document.querySelector('.immersive');
  const scenePin = document.querySelector('.immersive-pin');
  const progressBar = document.querySelector('.scroll-progress');
  const stories = [...document.querySelectorAll('.scene-story')];
  const counter = document.querySelector('.scene-counter');
  const canvas = document.querySelector('.scene-canvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => {
    const progress = clamp(value);
    return progress * progress * (3 - 2 * progress);
  };
  const milestones = [0, .2, .4, .6, .8, .96];
  let targetProgress = 0;
  let sceneProgress = 0;
  let activeStep = -1;
  let pointerX = 0;
  let pointerY = 0;
  let sceneVisible = true;

  const updateScroll = () => {
    const pageRange = root.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${pageRange > 0 ? window.scrollY / pageRange : 0})`;
    const sectionRange = immersive.offsetHeight - window.innerHeight;
    targetProgress = clamp(-immersive.getBoundingClientRect().top / sectionRange);
    let nextStep = 0;
    milestones.forEach((milestone, index) => {
      if (targetProgress >= milestone) nextStep = index;
    });
    if (nextStep !== activeStep) {
      activeStep = nextStep;
      stories.forEach((story, index) => story.classList.toggle('is-active', index === activeStep));
      scenePin.classList.toggle('is-final', activeStep === stories.length - 1);
      counter.textContent = `${String(activeStep + 1).padStart(2, '0')} — ${String(stories.length).padStart(2, '0')}`;
    }
  };

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  window.addEventListener('pointermove', event => {
    pointerX = (event.clientX / window.innerWidth - .5) * 2;
    pointerY = (event.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  document.querySelectorAll('.reveal').forEach(element => {
    const observer = new IntersectionObserver(([entry], currentObserver) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.disconnect();
      }
    }, { threshold: .14 });
    observer.observe(element);
  });
  document.querySelector('[data-current-year]').textContent = new Date().getFullYear();
  updateScroll();

  if (!window.THREE || !canvas) {
    document.body.classList.add('no-webgl');
    return;
  }

  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, window.innerWidth / window.innerHeight, .1, 80);
  const smallScreen = window.innerWidth < 760;
  camera.position.set(0, .08, smallScreen ? 11.7 : 8.4);

  scene.add(new THREE.HemisphereLight(0xe7f1ed, 0x101216, 1.05));
  const keyLight = new THREE.DirectionalLight(0xf4f7f2, 3.1);
  keyLight.position.set(-3, 4, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x9fc7c4, 2.15);
  rimLight.position.set(4, 1, -3);
  scene.add(rimLight);
  const warmLight = new THREE.PointLight(0xe78d68, 7, 11, 1.8);
  warmLight.position.set(-2.7, -2.2, 2.7);
  scene.add(warmLight);

  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const rig = new THREE.Group();
  sculpture.add(rig);

  const pearl = new THREE.MeshPhysicalMaterial({ color: 0x77858a, metalness: .72, roughness: .28, clearcoat: .75, clearcoatRoughness: .18, flatShading: true });
  const graphite = new THREE.MeshPhysicalMaterial({ color: 0x343d42, metalness: .8, roughness: .32, clearcoat: .75, clearcoatRoughness: .18, flatShading: true });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x78999a, metalness: .28, roughness: .1, transparent: true, opacity: .7, clearcoat: 1, clearcoatRoughness: .05, side: THREE.DoubleSide });
  const lime = new THREE.MeshStandardMaterial({ color: 0xc9f16a, metalness: .5, roughness: .25, emissive: 0x35431c, emissiveIntensity: .16 });
  const coral = new THREE.MeshStandardMaterial({ color: 0xe78d68, metalness: .4, roughness: .28 });

  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(1.08, 0), pearl);
  rig.add(core);
  const innerCore = new THREE.Mesh(new THREE.OctahedronGeometry(.47, 0), new THREE.MeshPhysicalMaterial({ color: 0x65777b, metalness: .84, roughness: .2, clearcoat: 1 }));
  rig.add(innerCore);
  const coreEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.26, 0)), new THREE.LineBasicMaterial({ color: 0xe8f0e8, transparent: true, opacity: .32 }));
  rig.add(coreEdges);

  const ringSpecs = [
    { radius: 1.64, sides: 6, color: 0xc9f16a, rotation: [.9, .2, .35], phase: .18 },
    { radius: 2.08, sides: 4, color: 0xc5d0cb, rotation: [.16, 1.05, -.42], phase: Math.PI / 4 },
    { radius: 1.38, sides: 5, color: 0xe78d68, rotation: [1.28, -.6, .2], phase: .12 }
  ];
  const rings = ringSpecs.map(spec => {
    const points = [];
    for (let index = 0; index < spec.sides; index += 1) {
      const angle = (index / spec.sides) * Math.PI * 2 + spec.phase;
      points.push(new THREE.Vector3(Math.cos(angle) * spec.radius, Math.sin(angle) * spec.radius, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const ring = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: spec.color, transparent: true, opacity: .74 }));
    ring.rotation.set(...spec.rotation);
    rig.add(ring);
    return ring;
  });

  const frame = new THREE.Group();
  const frameGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.15, 3.15, 2.25));
  const frameLines = new THREE.LineSegments(frameGeometry, new THREE.LineBasicMaterial({ color: 0x9daaa8, transparent: true, opacity: .48 }));
  frame.add(frameLines);
  frame.scale.setScalar(.001);
  sculpture.add(frame);

  const facets = [];
  const facetMaterials = [pearl, graphite, glass, lime, coral, pearl, graphite, glass];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + .18;
    const shape = new THREE.Mesh(new THREE.OctahedronGeometry(.34 + (index % 3) * .055, 0), facetMaterials[index]);
    const closed = new THREE.Vector3(Math.cos(angle) * .92, Math.sin(angle) * .92, (index % 2 ? -.34 : .36));
    const open = new THREE.Vector3(Math.cos(angle) * (2.08 + (index % 2) * .16), Math.sin(angle) * (1.75 + (index % 3) * .12), (index % 2 ? -.72 : .72));
    shape.position.copy(closed);
    shape.rotation.set(index * .31, angle, index * .19);
    rig.add(shape);
    facets.push({ mesh: shape, closed, open, seed: angle });
  }

  const orbitPoints = [];
  for (let index = 0; index < 54; index += 1) {
    const angle = index * 2.399963;
    const radius = 2.65 + (index % 7) * .055;
    orbitPoints.push(Math.cos(angle) * radius, Math.sin(angle) * radius * .7, Math.sin(angle * .7) * 1.5);
  }
  const orbitGeometry = new THREE.BufferGeometry();
  orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
  const dust = new THREE.Points(orbitGeometry, new THREE.PointsMaterial({ color: 0xbac7c1, size: .012, transparent: true, opacity: .26, sizeAttenuation: true }));
  sculpture.add(dust);

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isSmall = width < 760;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = isSmall ? 11.7 : 8.4;
    camera.updateProjectionMatrix();
    sculpture.position.set(isSmall ? 0 : 1.55, isSmall ? .36 : .02, 0);
    sculpture.scale.setScalar(isSmall ? .64 : 1);
    frame.position.x = isSmall ? 0 : 1.55;
  };
  window.addEventListener('resize', resize);
  resize();

  const sceneObserver = new IntersectionObserver(([entry]) => {
    sceneVisible = entry.isIntersecting;
  }, { rootMargin: '100px' });
  sceneObserver.observe(immersive);

  const clock = new THREE.Clock();
  const render = () => {
    requestAnimationFrame(render);
    const elapsed = clock.getElapsedTime();
    sceneProgress += (targetProgress - sceneProgress) * (reduceMotion ? 1 : .065);
    if (Math.abs(targetProgress - sceneProgress) < .0001) sceneProgress = targetProgress;
    if (!sceneVisible) return;

    const progress = sceneProgress;
    const unfold = smooth((progress - .13) / .22);
    const reform = smooth((progress - .76) / .2);
    const settle = smooth((progress - .86) / .14);
    const idle = reduceMotion ? 0 : elapsed;

    facets.forEach(({ mesh, closed, open, seed }) => {
      mesh.position.lerpVectors(closed, open, unfold * (1 - reform * .74));
      mesh.position.y += Math.sin(idle * .65 + seed) * .025 * (1 - settle);
      mesh.rotation.x = seed + progress * 1.15 + Math.sin(idle * .24 + seed) * .035;
      mesh.rotation.y = seed * .7 - progress * .8;
    });

    rig.rotation.set(.15 + progress * .45, progress * Math.PI * 1.12 + idle * .055 + pointerX * .06, -.12 + Math.sin(progress * Math.PI * 2) * .12 + pointerY * .035);
    rig.scale.setScalar(1 + unfold * .12 - reform * .06 + Math.sin(idle * .38) * .008);
    core.rotation.set(idle * .14 + progress * .45, idle * .19 - progress * .8, progress * .32);
    innerCore.rotation.set(-idle * .18, idle * .24 + progress * 1.2, progress * .55);
    coreEdges.rotation.copy(rig.rotation);
    rings.forEach((ring, index) => {
      ring.rotation.x = ringSpecs[index].rotation[0] + progress * (.45 + index * .12);
      ring.rotation.y = ringSpecs[index].rotation[1] + Math.sin(idle * .15 + index) * .04 + pointerX * .025;
      ring.rotation.z = ringSpecs[index].rotation[2] - progress * (.7 + index * .1);
      ring.scale.setScalar(1 + unfold * (.08 + index * .025) - reform * .045);
    });
    frame.scale.setScalar(Math.max(.001, smooth((progress - .53) / .19) * (1 - settle * .08)));
    frame.rotation.set(.06 * (1 - settle), .12 * (1 - settle) + progress * .22, -.08 * (1 - settle));
    dust.rotation.y = progress * .14 + pointerX * .018;
    camera.position.x += ((window.innerWidth < 760 ? 0 : .12 * pointerX) - camera.position.x) * .035;
    camera.position.y += (-pointerY * .08 - camera.position.y) * .035;
    camera.lookAt(window.innerWidth < 760 ? 0 : .5, 0, 0);
    renderer.render(scene, camera);
  };
  render();
})();
