const gsap = window.gsap;

const svg = document.querySelector("#octocat");
const cat = svg.querySelector("#cat");
const puddle = svg.querySelector("#puddle");
const hand = svg.querySelector("#hand");
const ears = svg.querySelector("#ears");
const pupils = svg.querySelectorAll(".pupil");
const burstEl = document.querySelector("#burst");
const feedEl = document.querySelector("#feed");
const glowEl = document.querySelector(".glow");

const repo = "PaulieScanlon/mastra-mcp-events";

let stars = 0;
let pulls = 0;
let issues = 0;

const renderDigits = (id, value, animate) => {
  const element = document.querySelector(`#${id}`);
  const text = String(value);
  while (element.children.length < text.length) {
    const digit = document.createElement("div");
    digit.className = "digit";
    const strip = document.createElement("div");
    strip.className = "strip";
    for (let n = 0; n <= 9; n += 1) {
      const span = document.createElement("span");
      span.textContent = String(n);
      strip.appendChild(span);
    }
    digit.appendChild(strip);
    element.prepend(digit);
  }
  while (element.children.length > text.length) {
    element.firstElementChild.remove();
  }
  [...element.children].forEach((digit, index) => {
    gsap.to(digit.querySelector(".strip"), {
      y: -Number(text[index]) * 28,
      duration: animate ? 0.9 : 0,
      ease: "back.out(1.6)",
      delay: animate ? (text.length - index - 1) * 0.06 : 0
    });
  });
  if (animate) {
    gsap.fromTo(element.closest(".stat").querySelector("svg"), { scale: 1.6, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  }
};

let bob;
let face = { eyes: "neutral", mouth: "neutral" };
let resetFace;

const show = (kind, name) => {
  svg.querySelectorAll(`.${kind}`).forEach((layer) => {
    layer.style.display = layer.id === `${kind}-${name}` ? "" : "none";
  });
};

const setFace = (eyes, mouth) => {
  show("eyes", eyes);
  show("mouths", mouth);
  face = { eyes, mouth };
};

const hidesHand = ["magnifier", "laptop"];
const hidesEars = ["fedora"];

const entrances = {
  laptop: { y: 260, opacity: 0, ease: "back.out(1.8)" },
  glasses: { y: -80, opacity: 0, ease: "back.out(2)" },
  magnifier: { x: 260, rotation: 30, opacity: 0, ease: "back.out(1.8)" },
  fedora: { y: -520, opacity: 0, ease: "bounce.out" },
  sunglasses: { y: -620, opacity: 0, ease: "power2.out" }
};

const rest = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

const reveal = (element, hidden) => {
  if (hidden) {
    gsap.killTweensOf(element);
    element.style.display = "none";
    return;
  }
  if (element.style.display === "none") {
    element.style.display = "";
    gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.35, delay: 0.2, ease: "power1.out" });
  }
};

const wear = (names) => {
  svg.querySelectorAll(".acc").forEach((layer) => {
    const name = layer.id.replace("acc-", "");
    const visible = names.includes(name);
    const wasVisible = layer.style.display !== "none";
    if (visible && !wasVisible) {
      gsap.killTweensOf(layer);
      gsap.set(layer, { ...rest, svgOrigin: "1000 1000" });
      layer.style.display = "";
      gsap.from(layer, { ...entrances[name], svgOrigin: "1000 1000", duration: name === "sunglasses" ? 0.9 : 0.6 });
    }
    if (!visible && wasVisible) {
      gsap.killTweensOf(layer);
      const { ease, ...exit } = entrances[name];
      gsap.to(layer, {
        ...exit,
        svgOrigin: "1000 1000",
        duration: 0.45,
        ease: "back.in(1.4)",
        onComplete: () => {
          layer.style.display = "none";
          gsap.set(layer, rest);
        }
      });
    }
  });
  reveal(hand, names.some((name) => { return hidesHand.includes(name); }));
  reveal(ears, names.some((name) => { return hidesEars.includes(name); }));
};

const react = (eyes, mouth, duration, accessories = []) => {
  resetFace?.kill();
  setFace(eyes, mouth);
  wear(accessories);
  resetFace = gsap.timeline({ delay: duration })
    .call(() => {
      wear([]);
    })
    .call(() => {
      show("eyes", "closed");
      show("mouths", "neutral");
      face = { eyes: "closed", mouth: "neutral" };
    }, null, 0.3)
    .call(() => {
      setFace("neutral", "neutral");
    }, null, 0.48)
    .fromTo(cat, { scaleY: 0.97 }, { scaleY: 1, svgOrigin: "981.8 1755.6", duration: 0.6, ease: "elastic.out(1, 0.5)" }, 0.3);
};

const startIdle = () => {
  bob = gsap.to(cat, { y: -18, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(puddle, { scaleX: 0.93, svgOrigin: "981.8 1755.6", duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
};

const blink = () => {
  if (face.eyes === "neutral") {
    show("eyes", "closed");
    gsap.delayedCall(0.13, () => {
      show("eyes", face.eyes);
    });
  }
  gsap.delayedCall(2.5 + Math.random() * 3.5, blink);
};

const followCursor = () => {
  let last = "";
  window.github?.onCursor((x, y) => {
    const key = `${x},${y}`;
    if (key === last) {
      return;
    }
    last = key;
    const box = svg.getBoundingClientRect();
    const dx = x - (box.left + box.width * 0.42);
    const dy = y - (box.top + box.height * 0.33);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = Math.min(distance / 300, 1);
    gsap.to(pupils, { x: (dx / distance) * reach * 18, y: (dy / distance) * reach * 14, duration: 0.3, ease: "power2.out" });
  });
};

const droop = () => {
  bob.pause();
  gsap.timeline({
    onComplete: () => {
      bob.restart();
    }
  })
    .to(cat, { y: 40, scaleY: 0.94, svgOrigin: "981.8 1755.6", duration: 0.6, ease: "power2.out", overwrite: "auto" })
    .to(cat, { y: 0, scaleY: 1, duration: 1.2, ease: "sine.inOut", delay: 1 });
};

const fallingStar = () => {
  const particle = document.createElement("span");
  particle.className = "particle";
  particle.textContent = "★";
  particle.style.color = "#8b949e";
  burstEl.appendChild(particle);
  gsap.fromTo(
    particle,
    { x: 40, y: -120, scale: 1.6, opacity: 1, rotation: 0 },
    {
      y: 110,
      x: 70,
      rotation: 160,
      opacity: 0,
      duration: 1.4,
      ease: "power2.in",
      onComplete: () => {
        particle.remove();
      }
    }
  );
};

const wave = () => {
  gsap.timeline()
    .to(hand, { rotation: -18, svgOrigin: "1440 1110", duration: 0.15, ease: "power2.out" })
    .to(hand, { rotation: 14, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 3 })
    .to(hand, { rotation: 0, duration: 0.4, ease: "back.out(2)" });
};

const burst = (color, symbol = "★") => {
  for (let n = 0; n < 16; n += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.textContent = symbol;
    particle.style.color = color;
    burstEl.appendChild(particle);
    const angle = (Math.PI * 2 * n) / 16 + Math.random() * 0.4;
    const distance = 90 + Math.random() * 50;
    gsap.fromTo(
      particle,
      { x: 0, y: 0, scale: 0.4, opacity: 1, rotation: 0 },
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0.8 + Math.random() * 0.8,
        rotation: Math.random() * 240 - 120,
        opacity: 0,
        duration: 1.1 + Math.random() * 0.4,
        ease: "power3.out",
        onComplete: () => {
          particle.remove();
        }
      }
    );
  }
};

const jump = () => {
  bob.pause();
  gsap.timeline({
    onComplete: () => {
      bob.restart();
    }
  })
    .to(cat, { scaleY: 0.92, scaleX: 1.05, svgOrigin: "981.8 1755.6", duration: 0.12, ease: "power2.in", overwrite: "auto" })
    .to(cat, { y: -160, scaleY: 1.06, scaleX: 0.97, duration: 0.28, ease: "power2.out" })
    .to(cat, { y: 0, scaleY: 1, scaleX: 1, duration: 0.75, ease: "bounce.out" });
  gsap.timeline()
    .to(puddle, { scaleX: 0.7, scaleY: 0.7, svgOrigin: "981.8 1755.6", duration: 0.4, ease: "power2.out" })
    .to(puddle, { scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  gsap.fromTo(glowEl, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1.15, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" });
};

const wiggle = () => {
  gsap.fromTo(cat, { rotation: -5 }, { rotation: 0, svgOrigin: "981.8 1755.6", duration: 0.9, ease: "elastic.out(1, 0.35)" });
};

const addCard = (color, text, meta) => {
  const card = document.createElement("div");
  card.className = "card";
  card.style.setProperty("--accent", color);
  card.innerHTML = `<span class="dot"></span><span class="text"></span>`;
  card.querySelector(".text").innerHTML = `${text} <span class="meta">${meta}</span>`;
  feedEl.prepend(card);
  const cards = [...feedEl.children];
  cards.slice(1).forEach((existing, offset) => {
    const index = offset + 1;
    gsap.to(existing, { y: index * 50, opacity: index > 2 ? 0 : 1 - index * 0.15, duration: 0.45, ease: "power3.out" });
    if (index > 2) {
      gsap.delayedCall(0.45, () => {
        existing.remove();
      });
    }
  });
  gsap.fromTo(card, { x: -40, y: 0, scale: 0.6, opacity: 0 }, { x: 0, scale: 1, opacity: 1, transformOrigin: "0% 50%", duration: 0.5, ease: "back.out(1.6)" });
};

const handlers = {
  "repo.starred": (data) => {
    stars = data.stars;
    renderDigits("stars", stars, true);
    react("starstruck", "starstruck", 2.2);
    jump();
    burst("#e3b341");
    addCard("#e3b341", `<b>@${data.user}</b> starred`, data.repo);
  },
  "repo.unstarred": (data) => {
    stars = data.stars;
    renderDigits("stars", stars, true);
    react("sad", "sad", 2.6);
    droop();
    fallingStar();
    addCard("#8b949e", `<b>@${data.user}</b> unstarred`, data.repo);
  },
  "pull_request.opened": (data) => {
    react("neutral", "happy", 2.6, ["laptop", "glasses"]);
    gsap.to("#acc-laptop", { y: -10, duration: 0.08, ease: "none", yoyo: true, repeat: 15, delay: 0.6 });
    burst("#3fb950", "+");
    pulls += 1;
    renderDigits("pulls", pulls, true);
    addCard("#3fb950", `PR #${data.number} ${data.title}`, `by @${data.author}`);
  },
  "pull_request.closed": (data) => {
    wiggle();
    pulls = Math.max(0, pulls - 1);
    renderDigits("pulls", pulls, true);
    if (data.merged) {
      react("hearts", "happy", 2);
      burst("#a371f7");
    } else {
      react("confused", "confused", 1.8);
    }
    addCard(data.merged ? "#a371f7" : "#f85149", `PR #${data.number} ${data.merged ? "merged" : "closed"}`, data.title);
  },
  "issue.opened": (data) => {
    react("crosseye", "confused", 2.6, ["magnifier", "fedora"]);
    wiggle();
    burst("#f85149", "!");
    issues += 1;
    renderDigits("issues", issues, true);
    addCard("#3fb950", `Issue #${data.number} ${data.title}`, `by @${data.author}`);
  },
  "issue.closed": (data) => {
    react("chillin", "chillin", 2.8, ["sunglasses"]);
    wave();
    burst("#a371f7", "✓");
    issues = Math.max(0, issues - 1);
    renderDigits("issues", issues, true);
    addCard("#a371f7", `Issue #${data.number} closed`, data.title);
  }
};

const users = ["octo-dev", "ada", "linus", "grace", "margaret", "tim"];
const pick = (items) => {
  return items[Math.floor(Math.random() * items.length)];
};
let nextNumber = 42;

const fakeEvent = (name) => {
  nextNumber += 1;
  if (name === "repo.starred") {
    return { repo, user: pick(users), stars: stars + 1 };
  }
  if (name === "repo.unstarred") {
    return { repo, user: pick(users), stars: Math.max(0, stars - 1) };
  }
  const item = { repo, number: nextNumber, title: pick(["Fix flaky test", "Add dark mode", "Update docs", "Speed up build"]), author: pick(users), url: "" };
  if (name === "pull_request.closed") {
    return { ...item, merged: true };
  }
  if (name === "issue.closed") {
    return { ...item, reason: "completed" };
  }
  return item;
};

document.querySelectorAll(".tests button").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.event;
    handlers[name](fakeEvent(name));
  });
});

const github = async (path) => {
  const response = await fetch(`https://api.github.com/${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) {
    throw new Error(`GitHub ${response.status} for ${path}`);
  }
  return response.json();
};

const loadCounts = async () => {
  const [details, openPulls] = await Promise.all([
    github(`repos/${repo}`),
    github(`repos/${repo}/pulls?state=open&per_page=100`)
  ]);
  stars = details.stargazers_count;
  pulls = openPulls.length;
  issues = details.open_issues_count - openPulls.length;
  renderDigits("stars", stars, true);
  renderDigits("pulls", pulls, true);
  renderDigits("issues", issues, true);
};

renderDigits("stars", stars, false);
renderDigits("pulls", pulls, false);
renderDigits("issues", issues, false);
let pendingResync;

const resync = () => {
  pendingResync?.kill();
  pendingResync = gsap.delayedCall(1, () => {
    loadCounts().catch((error) => {
      console.error(error);
    });
  });
};

resync();

window.github?.onEvent((name, data) => {
  handlers[name]?.(data);
});

window.github?.onResync(resync);
startIdle();
gsap.delayedCall(1.5, blink);
followCursor();
