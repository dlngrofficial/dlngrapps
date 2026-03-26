const galleryTrack = document.getElementById("gallery-track");
const gallerySlides = document.querySelectorAll(".gallery-slide");
const galleryDots = document.querySelectorAll(".gallery-dot");
const galleryPrev = document.getElementById("gallery-prev");
const galleryNext = document.getElementById("gallery-next");
const appDetails = {
  xp: {
    title: "DLNGR-XP",
    description: "A dedicated review space where the DLNGR community can post reactions, experiences, and ratings about apps across the universe.",
    points: [
      "Uses the same DLNGR account ecosystem",
      "Built for public reviews and community feedback",
      "Created as a fresh expansion of the DLNGR platform"
    ],
    adoption: "Community Launch",
    fit: "Reviews And Feedback"
  },
  privechat: {
    title: "PriveChat-DLNGR",
    description: "A more private and focused messaging experience for direct conversations across the DLNGR platform.",
    points: [
      "Private one-to-one chat flow",
      "Built for more focused conversations",
      "Part of the current live DLNGR lineup"
    ],
    adoption: "Live Messaging",
    fit: "Direct Conversations"
  },
  ai: {
    title: "DLNGR-AI",
    description: "An artificial intelligence experience from DLNGR Studios designed for conversation, ideas, and task support.",
    points: [
      "Conversation-first AI interface",
      "Idea support and task help",
      "Flagship DLNGR intelligence product"
    ],
    adoption: "Flagship AI",
    fit: "Intelligent Assistance"
  },
  openchat: {
    title: "DLNGR CHAT",
    description: "A more open platform for sharing thoughts and ideas with others in the wider DLNGR community.",
    points: [
      "Open conversation format",
      "Made for broad community interaction",
      "Fast entry point into the DLNGR network"
    ],
    adoption: "Community Ready",
    fit: "Open Chatting"
  },
  system: {
    title: "DLNGR System",
    description: "A structured planning and productivity experience that helps organize daily work and activities.",
    points: [
      "Task planning and record handling",
      "Built to simplify daily workflow",
      "Productivity-focused DLNGR tool"
    ],
    adoption: "Productivity Core",
    fit: "Planning And Workflow"
  },
  manga: {
    title: "DLNGR Manga",
    description: "A creative reading destination for manga projects and visual storytelling built inside DLNGR.",
    points: [
      "Creative storytelling space",
      "Visual-first reading experience",
      "Long-running DLNGR creative project"
    ],
    adoption: "Creative Library",
    fit: "Readers And Creators"
  },
  jarvis: {
    title: "DLNGR-Jarvis",
    description: "An assistant-style DLNGR experience shaped around voice-inspired task support and guided automation.",
    points: [
      "Assistant-driven workflows",
      "Task support with DLNGR branding",
      "One of the earlier DLNGR intelligence projects"
    ],
    adoption: "Assistant Stack",
    fit: "Guided Automation"
  },
  games: {
    title: "DLNGR-Games",
    description: "A gaming-focused DLNGR release aimed at bringing a more experimental play experience to Windows users.",
    points: [
      "Windows-first release",
      "Gameplay-focused DLNGR project",
      "Built to expand the DLNGR universe beyond tools"
    ],
    adoption: "Playable Build",
    fit: "Gaming Audience"
  }
};
const detailButtons = document.querySelectorAll(".card-link");
const spotlightTitle = document.getElementById("spotlight-title");
const spotlightDescription = document.getElementById("spotlight-description");
const spotlightPoints = document.getElementById("spotlight-points");
const spotlightAdoption = document.getElementById("spotlight-adoption");
const spotlightFit = document.getElementById("spotlight-fit");

let currentSlide = 0;
let autoSlide;
let touchStartX = 0;
let touchEndX = 0;

function renderSlide(index) {
  if (!galleryTrack || gallerySlides.length === 0) {
    return;
  }

  currentSlide = (index + gallerySlides.length) % gallerySlides.length;
  galleryTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

  galleryDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === currentSlide);
  });
}

function nextSlide() {
  renderSlide(currentSlide + 1);
}

function prevSlide() {
  renderSlide(currentSlide - 1);
}

function restartAutoSlide() {
  window.clearInterval(autoSlide);
  autoSlide = window.setInterval(nextSlide, 4500);
}

galleryPrev?.addEventListener("click", () => {
  prevSlide();
  restartAutoSlide();
});

galleryNext?.addEventListener("click", () => {
  nextSlide();
  restartAutoSlide();
});

galleryDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    renderSlide(Number(dot.dataset.slide));
    restartAutoSlide();
  });
});

galleryTrack?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
});

galleryTrack?.addEventListener("touchend", (event) => {
  touchEndX = event.changedTouches[0].screenX;
  const swipeDistance = touchEndX - touchStartX;

  if (Math.abs(swipeDistance) < 40) {
    return;
  }

  if (swipeDistance < 0) {
    nextSlide();
  } else {
    prevSlide();
  }

  restartAutoSlide();
});

renderSlide(0);
restartAutoSlide();

function renderSpotlight(detailKey) {
  const detail = appDetails[detailKey];

  if (!detail) {
    return;
  }

  spotlightTitle.textContent = detail.title;
  spotlightDescription.textContent = detail.description;
  spotlightAdoption.textContent = detail.adoption;
  spotlightFit.textContent = detail.fit;

  spotlightPoints.innerHTML = "";
  detail.points.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    spotlightPoints.appendChild(item);
  });
}

detailButtons.forEach((button) => {
  const detailKey = button.dataset.app;

  button.addEventListener("mouseenter", () => renderSpotlight(detailKey));
  button.addEventListener("focus", () => renderSpotlight(detailKey));
  button.addEventListener("touchstart", () => renderSpotlight(detailKey), { passive: true });
});
