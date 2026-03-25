const galleryTrack = document.getElementById("gallery-track");
const gallerySlides = document.querySelectorAll(".gallery-slide");
const galleryDots = document.querySelectorAll(".gallery-dot");
const galleryPrev = document.getElementById("gallery-prev");
const galleryNext = document.getElementById("gallery-next");
const appDetails = {
  flow: {
    title: "DLNGR Flow",
    description: "A focused planning hub that helps teams map work, assign ownership, and keep delivery visible.",
    points: [
      "Shared workspaces for team planning",
      "Milestone tracking and progress views",
      "Designed for quick onboarding"
    ],
    adoption: "82%",
    fit: "Operations Teams"
  },
  pulse: {
    title: "DLNGR Pulse",
    description: "A live analytics app that turns raw product and customer data into readable decision signals.",
    points: [
      "Custom KPI dashboards",
      "Performance summaries in real time",
      "Trend spotting for growth teams"
    ],
    adoption: "76%",
    fit: "Growth Leads"
  },
  cart: {
    title: "DLNGR Cart",
    description: "A commerce-ready toolkit that helps brands launch storefronts faster and optimize buying journeys.",
    points: [
      "Fast product setup",
      "Conversion-focused checkout flow",
      "Flexible campaign support"
    ],
    adoption: "69%",
    fit: "Retail Brands"
  },
  studio: {
    title: "DLNGR Studio",
    description: "A creative operations platform that helps content teams organize assets and speed up approvals.",
    points: [
      "Asset libraries with review history",
      "Feedback loops for design teams",
      "Version clarity across campaigns"
    ],
    adoption: "74%",
    fit: "Creative Teams"
  },
  sync: {
    title: "DLNGR Sync",
    description: "A fast internal communication layer for sharing updates, announcements, and action items.",
    points: [
      "Team channels with clean summaries",
      "Update distribution across departments",
      "Focused communication without clutter"
    ],
    adoption: "80%",
    fit: "Internal Comms"
  },
  signal: {
    title: "DLNGR Signal",
    description: "An event intelligence app that surfaces meaningful changes across product, ops, and campaign activity.",
    points: [
      "Event-based alert monitoring",
      "Cross-channel behavior tracking",
      "Early warnings on performance shifts"
    ],
    adoption: "71%",
    fit: "Data Teams"
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

detailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const detail = appDetails[button.dataset.app];

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

    document.getElementById("spotlight").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
