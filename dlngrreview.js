(function () {
  const firebaseConfig = window.firebaseConfig;
  const SERVER_TIME = firebase.firestore.FieldValue.serverTimestamp;
  const CREATOR_EMAIL = "rajeshvishavkarma390@gmail.com";
  const RESERVED_NAMES = ["dlngr", "dlngr store", "dlngr ai"];

  const state = {
    currentUser: null,
    currentProfile: null,
    reviews: []
  };

  const authView = document.getElementById("authView");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authNameField = document.getElementById("authNameField");
  const authNameInput = document.getElementById("authNameInput");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const authToggleButton = document.getElementById("authToggleButton");
  const authStatus = document.getElementById("authStatus");
  const setupBanner = document.getElementById("setupBanner");
  const reviewApp = document.getElementById("reviewApp");
  const menuToggleButton = document.getElementById("menuToggleButton");
  const reviewSidebar = document.getElementById("reviewSidebar");
  const reviewSidebarBackdrop = document.getElementById("reviewSidebarBackdrop");
  const writeReviewNavButton = document.getElementById("writeReviewNavButton");
  const sidebarLogoutButton = document.getElementById("sidebarLogoutButton");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserHandle = document.getElementById("sidebarUserHandle");
  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const currentUserName = document.getElementById("currentUserName");
  const currentUserHandle = document.getElementById("currentUserHandle");
  const currentUserAvatar = document.getElementById("currentUserAvatar");
  const logoutButton = document.getElementById("logoutButton");
  const composerPanel = document.getElementById("composerPanel");
  const reviewForm = document.getElementById("reviewForm");
  const reviewRating = document.getElementById("reviewRating");
  const reviewTitle = document.getElementById("reviewTitle");
  const reviewText = document.getElementById("reviewText");
  const reviewStatus = document.getElementById("reviewStatus");
  const reviewFeed = document.getElementById("reviewFeed");
  const reviewCountLabel = document.getElementById("reviewCountLabel");

  let isLoginMode = true;
  let auth = null;
  let db = null;
  let reviewsUnsubscribe = null;
  let isSidebarOpen = false;

  function isConfigMissing() {
    return !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "REPLACE_ME";
  }

  function normalizeNameKey(name) {
    return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function emailLocalPart(email) {
    return String(email || "").split("@")[0].trim().toLowerCase();
  }

  function nameLooksLikeEmailPrefix(name, email) {
    return normalizeNameKey(name) === emailLocalPart(email);
  }

  function normalizeDisplayName(user) {
    if (!user) return "User";
    if (user.displayName && user.displayName.trim()) return user.displayName.trim();
    if (user.fullName && user.fullName.trim()) return user.fullName.trim();
    return "User";
  }

  function initialsFromName(name) {
    return (name || "User")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(value) {
    if (!value) return "Just now";
    const date = value.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function setAuthMode(loginMode) {
    isLoginMode = loginMode;
    authTitle.textContent = loginMode ? "Welcome back" : "Create your account";
    authSubtitle.textContent = loginMode
      ? "Use your DLNGR account to publish your DLNGR review."
      : "Create one account and use it on all of DLNGR-Apps.";
    authNameField.hidden = loginMode;
    authSubmitButton.textContent = loginMode ? "Login" : "Create account";
    authToggleButton.textContent = loginMode ? "Need an account? Sign up" : "Already have an account? Login";
    authStatus.textContent = "";
  }

  function setAuthStatus(message) {
    authStatus.textContent = message || "";
  }

  function setAuthenticatedUi(isAuthenticated) {
    authView.hidden = isAuthenticated;
    reviewApp.hidden = !isAuthenticated;
    menuToggleButton.hidden = !isAuthenticated;
  }

  function isMobileViewport() {
    return window.innerWidth <= 620;
  }

  function setSidebarOpen(isOpen) {
    isSidebarOpen = isOpen;
    if (!reviewSidebar || !reviewSidebarBackdrop) return;
    reviewSidebar.classList.toggle("is-open", isOpen);
    reviewSidebarBackdrop.hidden = !isOpen;
    menuToggleButton.classList.toggle("is-shifted", isOpen);
  }

  function validateDisplayName(displayName, currentUid) {
    const normalized = normalizeNameKey(displayName);
    if (!normalized) return Promise.resolve("Please enter a valid name.");
    if (RESERVED_NAMES.includes(normalized)) return Promise.resolve("That name is reserved and cannot be used.");
    return db.collection("users")
      .where("displayNameLower", "==", normalized)
      .limit(1)
      .get()
      .then(function (snapshot) {
        if (snapshot.empty) return "";
        const existing = snapshot.docs[0].data();
        if (existing.uid === currentUid) return "";
        return "That name is already taken. Please choose another one.";
      });
  }

  function ensureUserProfile(user, displayNameOverride) {
    const inputName = displayNameOverride ? displayNameOverride.trim() : "";
    const existingName = user.displayName && user.displayName.trim() ? user.displayName.trim() : "";
    const userRef = db.collection("users").doc(user.uid);

    return userRef.get().then(function (snapshot) {
      const currentData = snapshot.exists ? snapshot.data() : {};
      const storedName = currentData.displayName && currentData.displayName.trim() ? currentData.displayName.trim() : "";
      const storedFullName = currentData.fullName && currentData.fullName.trim() ? currentData.fullName.trim() : "";
      const finalName =
        inputName ||
        (!nameLooksLikeEmailPrefix(storedName, user.email) && storedName) ||
        (!nameLooksLikeEmailPrefix(storedFullName, user.email) && storedFullName) ||
        (!nameLooksLikeEmailPrefix(existingName, user.email) && existingName) ||
        storedName ||
        storedFullName ||
        existingName ||
        "User";

      return userRef.set({
        uid: user.uid,
        displayName: finalName,
        displayNameLower: normalizeNameKey(finalName),
        fullName: finalName,
        email: user.email,
        photoInitials: initialsFromName(finalName),
        createdAt: snapshot.exists ? currentData.createdAt || SERVER_TIME() : SERVER_TIME(),
        updatedAt: SERVER_TIME()
      }, { merge: true }).then(function () {
        if (!user.displayName && finalName && finalName !== "User") {
          return user.updateProfile({ displayName: finalName });
        }
        return null;
      });
    });
  }

  function loadCurrentProfile(user) {
    return db.collection("users").doc(user.uid).get().then(function (snapshot) {
      state.currentProfile = snapshot.exists ? snapshot.data() : null;
      const displayName = normalizeDisplayName(state.currentProfile);
      const handleText = state.currentProfile && state.currentProfile.email === CREATOR_EMAIL ? "Creator account" : "Signed in";
      const initials = initialsFromName(displayName);
      currentUserName.textContent = displayName;
      currentUserHandle.textContent = handleText;
      currentUserAvatar.textContent = initials;
      if (sidebarUserName) sidebarUserName.textContent = displayName;
      if (sidebarUserHandle) sidebarUserHandle.textContent = handleText;
      if (sidebarUserAvatar) sidebarUserAvatar.textContent = initials;
    });
  }

  function renderStars(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  function renderReviews() {
    reviewFeed.innerHTML = "";
    reviewCountLabel.textContent = state.reviews.length + (state.reviews.length === 1 ? " review" : " reviews");

    if (!state.reviews.length) {
      reviewFeed.innerHTML = '<div class="review-card"><p class="review-body">No reviews yet. Be the first to post one.</p></div>';
      return;
    }

    state.reviews.forEach(function (review) {
      const article = document.createElement("article");
      const canDelete = state.currentUser && (review.userId === state.currentUser.uid || (state.currentProfile && state.currentProfile.email === CREATOR_EMAIL));
      article.className = "review-card";
      article.innerHTML =
        '<div class="review-top">' +
          '<div class="review-author">' +
            '<div class="avatar-ring"><div class="avatar">' + escapeHtml(initialsFromName(review.displayName)) + '</div></div>' +
            '<div><strong>' + escapeHtml(review.displayName) + '</strong><div class="review-meta">' + escapeHtml(formatTime(review.createdAt)) + '</div></div>' +
          '</div>' +
          '<div class="review-rating">' + escapeHtml(renderStars(review.rating)) + '</div>' +
        '</div>' +
        '<h3 class="review-title">' + escapeHtml(review.title) + '</h3>' +
        '<p class="review-body">' + escapeHtml(review.text) + '</p>' +
        (canDelete ? '<div class="review-actions"><button class="review-delete" data-review-id="' + escapeHtml(review.id) + '">Delete</button></div>' : "");
      reviewFeed.appendChild(article);
    });
  }

  function startReviewsListener() {
    if (reviewsUnsubscribe) reviewsUnsubscribe();
    reviewsUnsubscribe = db.collection("reviews")
      .orderBy("createdAt", "desc")
      .onSnapshot(function (snapshot) {
        state.reviews = snapshot.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        renderReviews();
      });
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();
    const displayName = authNameInput.value.trim();

    if (!email || !password || (!isLoginMode && !displayName)) {
      setAuthStatus("Please complete all required fields.");
      return;
    }

    const action = isLoginMode ? auth.signInWithEmailAndPassword(email, password) : auth.createUserWithEmailAndPassword(email, password);
    action.then(function (credential) {
      if (!isLoginMode) {
        return validateDisplayName(displayName, credential.user.uid).then(function (validationError) {
          if (!validationError) return credential;
          return credential.user.delete().then(function () {
            throw new Error(validationError);
          });
        }).then(function () {
          return ensureUserProfile(credential.user, displayName);
        });
      }
      return null;
    }).then(function () {
      authNameInput.value = "";
      authEmailInput.value = "";
      authPasswordInput.value = "";
      setAuthStatus("");
    }).catch(function (error) {
      setAuthStatus(error.message || "Authentication failed.");
    });
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    if (!state.currentUser || !state.currentProfile) return;

    const payload = {
      userId: state.currentUser.uid,
      displayName: normalizeDisplayName(state.currentProfile),
      email: state.currentProfile.email,
      rating: Number(reviewRating.value),
      title: reviewTitle.value.trim(),
      text: reviewText.value.trim(),
      createdAt: SERVER_TIME(),
      updatedAt: SERVER_TIME()
    };

    if (!payload.title || !payload.text) {
      reviewStatus.textContent = "Please complete your headline and review.";
      return;
    }

    db.collection("reviews").add(payload).then(function () {
      reviewTitle.value = "";
      reviewText.value = "";
      reviewRating.value = "5";
      reviewStatus.textContent = "Review published.";
    }).catch(function (error) {
      if (error && error.code === "permission-denied") {
        reviewStatus.textContent = "Review permissions are blocked. Publish the updated Firestore rules, then try again.";
        return;
      }
      reviewStatus.textContent = error.message || "Could not publish review.";
    });
  }

  function handleDeleteReview(reviewId) {
    if (!reviewId) return;
    if (!window.confirm("Delete this review?")) return;
    db.collection("reviews").doc(reviewId).delete().catch(function (error) {
      reviewStatus.textContent = error.message || "Could not delete review.";
    });
  }

  function initFirebase() {
    if (isConfigMissing()) {
      setupBanner.hidden = false;
      setAuthenticatedUi(false);
      return;
    }

    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    auth.onAuthStateChanged(function (user) {
      if (!user) {
        state.currentUser = null;
        state.currentProfile = null;
        setAuthenticatedUi(false);
        if (reviewsUnsubscribe) {
          reviewsUnsubscribe();
          reviewsUnsubscribe = null;
        }
        return;
      }

      state.currentUser = user;
      ensureUserProfile(user)
        .then(function () { return loadCurrentProfile(user); })
        .then(function () {
          setAuthenticatedUi(true);
          startReviewsListener();
        })
        .catch(function (error) {
          setAuthStatus(error.message || "Could not load account.");
        });
    });
  }

  authToggleButton.addEventListener("click", function () {
    setAuthMode(!isLoginMode);
  });
  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
  reviewForm.addEventListener("submit", handleReviewSubmit);
  logoutButton.addEventListener("click", function () {
    auth.signOut();
  });
  sidebarLogoutButton.addEventListener("click", function () {
    auth.signOut();
  });
  menuToggleButton.addEventListener("click", function () {
    if (!isMobileViewport()) return;
    setSidebarOpen(!isSidebarOpen);
  });
  reviewSidebarBackdrop.addEventListener("click", function () {
    setSidebarOpen(false);
  });
  writeReviewNavButton.addEventListener("click", function () {
    setSidebarOpen(false);
    if (composerPanel) {
      composerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (reviewTitle) {
      window.setTimeout(function () {
        reviewTitle.focus();
      }, 180);
    }
  });
  reviewFeed.addEventListener("click", function (event) {
    const button = event.target.closest(".review-delete");
    if (!button) return;
    handleDeleteReview(button.getAttribute("data-review-id"));
  });
  window.addEventListener("resize", function () {
    if (!isMobileViewport()) {
      setSidebarOpen(false);
    }
  });

  setAuthMode(true);
  initFirebase();
})();
