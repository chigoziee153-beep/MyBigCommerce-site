(function () {
  function stripWorkgridArtifacts() {
    var boot = document.getElementById("workgrid-boot");
    if (boot) boot.remove();
    var css = document.getElementById("workgrid-css");
    if (css) css.remove();
    var gf = document.getElementById("workgrid-gridfix");
    if (gf) gf.remove();
    document.querySelectorAll(".wg-slider, .wg-experience, .wg-sticky, .wg-foot, .wg-foot__bar").forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('link[href*="Plus+Jakarta+Sans"]').forEach(function (el) {
      el.remove();
    });
  }

  function truthy(v) {
    return String(v == null ? "" : v).toLowerCase() === "true" || v === true || v === "1";
  }

  /** Promo: desktop pages by 3-card slides; mobile pages by single card. */
  function initPromoCarousels() {
    document.querySelectorAll("[data-tac-promo-rail]").forEach(function (rail) {
      if (rail.getAttribute("data-tac-ready") === "1") return;
      rail.setAttribute("data-tac-ready", "1");

      var track = rail.querySelector("[data-tac-promo-track]");
      if (!track) return;
      var slides = track.querySelectorAll("[data-tac-promo-slide]");
      if (!slides.length) return;

      var prev = rail.querySelector("[data-tac-promo-prev]");
      var next = rail.querySelector("[data-tac-promo-next]");
      var dotsHost = rail.querySelector("[data-tac-promo-dots]");
      var pauseBtn = rail.querySelector("[data-tac-promo-pause]");
      var autoplayOn = truthy(rail.getAttribute("data-tac-autoplay") || "true");
      var intervalMs = parseInt(rail.getAttribute("data-tac-interval"), 10);
      if (!intervalMs || intervalMs < 2000) intervalMs = 5500;
      var pauseHover = truthy(rail.getAttribute("data-tac-pause-hover") || "true");

      var index = 0;
      var paused = false;
      var autoTimer = null;
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var mobileMq = window.matchMedia ? window.matchMedia("(max-width: 899px)") : null;

      function isMobile() {
        return !!(mobileMq && mobileMq.matches);
      }

      function units() {
        if (isMobile()) {
          return track.querySelectorAll(".tac-promo-card");
        }
        return slides;
      }

      function slideCount() {
        return units().length;
      }

      function goTo(i, smooth) {
        var pages = units();
        var n = pages.length;
        if (!n) return;
        index = ((i % n) + n) % n;
        var targetLeft = pages[index] ? pages[index].offsetLeft : index * track.clientWidth;
        var useSmooth = smooth !== false && !reduceMotion;
        // Instant positioning for user controls avoids stacked smooth-scroll races.
        if (!useSmooth) {
          track.scrollLeft = Math.round(targetLeft);
        } else {
          track.scrollTo({ left: Math.round(targetLeft), behavior: "smooth" });
        }
        updateDots();
      }

      function syncDots() {
        if (!dotsHost) return;
        dotsHost.innerHTML = "";
        for (var i = 0; i < slideCount(); i++) {
          (function (page) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tac-dots__btn" + (page === index ? " is-active" : "");
            btn.setAttribute("aria-label", "Go to slide " + (page + 1));
            if (page === index) btn.setAttribute("aria-current", "true");
            else btn.removeAttribute("aria-current");
            btn.addEventListener("click", function () {
              goTo(page, false);
              restartAuto();
            });
            dotsHost.appendChild(btn);
          })(i);
        }
        dotsHost.hidden = slideCount() < 2;
      }

      function updateDots() {
        if (!dotsHost) return;
        Array.prototype.forEach.call(dotsHost.children, function (el, i) {
          var on = i === index;
          el.classList.toggle("is-active", on);
          if (on) el.setAttribute("aria-current", "true");
          else el.removeAttribute("aria-current");
        });
      }

      function inferIndexFromScroll() {
        var pages = units();
        var best = 0;
        var bestDist = Infinity;
        var left = track.scrollLeft;
        for (var i = 0; i < pages.length; i++) {
          var dist = Math.abs(pages[i].offsetLeft - left);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
        if (best !== index) {
          index = best;
          updateDots();
        }
      }

      function stopAuto() {
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
        }
      }

      function startAuto() {
        stopAuto();
        if (!autoplayOn || paused || reduceMotion || slideCount() < 2) return;
        autoTimer = setInterval(function () {
          goTo(index + 1);
        }, intervalMs);
      }

      function restartAuto() {
        if (!paused) startAuto();
      }

      if (prev) {
        prev.addEventListener("click", function () {
          goTo(index - 1, false);
          restartAuto();
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          goTo(index + 1, false);
          restartAuto();
        });
      }

      if (pauseBtn) {
        pauseBtn.addEventListener("click", function () {
          paused = !paused;
          pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
          pauseBtn.setAttribute("aria-label", paused ? "Play carousel" : "Pause carousel");
          pauseBtn.textContent = paused ? "▶" : "❚❚";
          if (paused) stopAuto();
          else startAuto();
        });
      }

      track.addEventListener("scroll", function () {
        window.clearTimeout(track._tacScrollT);
        track._tacScrollT = window.setTimeout(inferIndexFromScroll, 80);
      });

      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(index - 1, false);
          restartAuto();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(index + 1, false);
          restartAuto();
        }
      });

      if (pauseHover) {
        rail.addEventListener("mouseenter", function () {
          if (autoplayOn && !paused) stopAuto();
        });
        rail.addEventListener("mouseleave", function () {
          if (autoplayOn && !paused) startAuto();
        });
      }

      var resizeT;
      function onViewportChange() {
        window.clearTimeout(resizeT);
        resizeT = window.setTimeout(function () {
          index = 0;
          syncDots();
          goTo(0, false);
          restartAuto();
        }, 120);
      }
      window.addEventListener("resize", onViewportChange);
      if (mobileMq) {
        if (typeof mobileMq.addEventListener === "function") {
          mobileMq.addEventListener("change", onViewportChange);
        } else if (typeof mobileMq.addListener === "function") {
          mobileMq.addListener(onViewportChange);
        }
      }

      syncDots();
      goTo(0, false);
      startAuto();
    });
  }

  /** Full-panel fade carousel. Slide time and fade length come from Page Builder. */
  function initPanelCarousels() {
    document.querySelectorAll("[data-tac-panel-carousel]").forEach(function (root) {
      if (root.getAttribute("data-tac-ready") === "1") return;
      root.setAttribute("data-tac-ready", "1");

      var slides = root.querySelectorAll("[data-tac-panel-slide]");
      if (!slides.length) return;

      var dotsHost = root.querySelector("[data-tac-panel-dots]");
      var pauseBtn = root.querySelector("[data-tac-panel-pause]");
      var autoplayOn = truthy(root.getAttribute("data-tac-autoplay") || "true");
      var rawInterval = parseInt(root.getAttribute("data-tac-interval"), 10);
      var intervalMs = !rawInterval || rawInterval < 1 ? 6000 : rawInterval >= 100 ? rawInterval : rawInterval * 1000;
      if (intervalMs < 2000) intervalMs = 2000;
      var fadeMs = parseInt(root.getAttribute("data-tac-fade"), 10);
      if (!fadeMs || fadeMs < 100) fadeMs = 420;
      if (fadeMs > 2000) fadeMs = 2000;
      root.style.setProperty("--tac-panel-fade", fadeMs + "ms");

      var pauseHover = truthy(root.getAttribute("data-tac-pause-hover") || "true");
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var index = 0;
      var paused = false;
      var timer = null;

      function show(i) {
        var count = slides.length;
        index = ((i % count) + count) % count;
        Array.prototype.forEach.call(slides, function (slide, slideIndex) {
          var on = slideIndex === index;
          slide.classList.toggle("is-active", on);
          if (on) {
            slide.removeAttribute("aria-hidden");
            slide.removeAttribute("inert");
          } else {
            slide.setAttribute("aria-hidden", "true");
            slide.setAttribute("inert", "");
          }
        });
        if (!dotsHost) return;
        Array.prototype.forEach.call(dotsHost.children, function (dot, dotIndex) {
          var on = dotIndex === index;
          dot.classList.toggle("is-active", on);
          if (on) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
      }

      function stopAuto() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      function startAuto() {
        stopAuto();
        if (!autoplayOn || paused || reduceMotion || slides.length < 2) return;
        timer = setInterval(function () {
          show(index + 1);
        }, intervalMs);
      }

      if (dotsHost) {
        dotsHost.innerHTML = "";
        for (var i = 0; i < slides.length; i++) {
          (function (page) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tac-dots__btn";
            btn.setAttribute("aria-label", "Go to slide " + (page + 1));
            btn.addEventListener("click", function () {
              show(page);
              if (!paused) startAuto();
            });
            dotsHost.appendChild(btn);
          })(i);
        }
        dotsHost.hidden = slides.length < 2;
      }

      if (pauseBtn) {
        pauseBtn.hidden = slides.length < 2;
        pauseBtn.addEventListener("click", function () {
          paused = !paused;
          pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
          pauseBtn.setAttribute("aria-label", paused ? "Play slides" : "Pause slides");
          pauseBtn.textContent = paused ? "▶" : "❚❚";
          if (paused) stopAuto();
          else startAuto();
        });
      }

      root.addEventListener("keydown", function (e) {
        if (e.target && e.target.closest && e.target.closest("a")) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          show(index - 1);
          if (!paused) startAuto();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          show(index + 1);
          if (!paused) startAuto();
        }
      });

      if (pauseHover) {
        root.addEventListener("mouseenter", function () {
          if (autoplayOn && !paused) stopAuto();
        });
        root.addEventListener("mouseleave", function () {
          if (autoplayOn && !paused) startAuto();
        });
      }

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stopAuto();
        else if (!paused) startAuto();
      });

      root.classList.add("is-ready");
      show(0);
      startAuto();
    });
  }

  /** Category / product / other horizontal rails (not slide-based). */
  function initRails() {
    document.querySelectorAll("[data-tac-rail]").forEach(function (rail) {
      if (rail.hasAttribute("data-tac-promo-rail")) return;
      if (rail.getAttribute("data-tac-ready") === "1") return;
      rail.setAttribute("data-tac-ready", "1");

      var track = rail.querySelector("[data-tac-rail-track]");
      if (!track) return;
      var prev = rail.querySelector("[data-tac-rail-prev]");
      var next = rail.querySelector("[data-tac-rail-next]");
      var host = rail.closest(".tac-cat-entry, .tac-promo-stage__main, .tac-promo-stage, .tac-product-rail, .tac-pills, .tac-top-cats") || rail.parentElement;
      var isCircleRail = !!(host && host.classList.contains("tac-cat-entry"));
      var dotsHost = !isCircleRail && host ? host.querySelector("[data-tac-rail-dots]") : null;
      var usesEdgeFades =
        rail.hasAttribute("data-tac-product-rail") || rail.hasAttribute("data-tac-pill-rail");

      function overflowAmount() {
        return Math.max(0, track.scrollWidth - track.clientWidth - 2);
      }

      function cardStep() {
        var styles = window.getComputedStyle(track);
        var gap = parseFloat(styles.columnGap || styles.gap) || 0;
        var isPillRail = rail.hasAttribute("data-tac-pill-rail");

        /* Pill rails: first pill is often short ("All") — use a typical width and
           advance ~2 pills so long labels clear in one click. */
        if (isPillRail) {
          var pills = track.querySelectorAll(".tac-pill");
          if (!pills.length) return Math.max(220, Math.floor(track.clientWidth * 0.35));
          var widths = [];
          for (var i = 0; i < pills.length && i < 8; i++) {
            widths.push(pills[i].getBoundingClientRect().width);
          }
          widths.sort(function (a, b) { return a - b; });
          var typical = widths[Math.floor(widths.length / 2)] || widths[0];
          return Math.max(160, (typical + gap) * 2);
        }

        var card = track.querySelector(
          ".tac-product-card:not([hidden]), .tac-cat-circle, .tac-campaign-slide, .tac-pill"
        );
        if (!card) return Math.max(180, Math.floor(track.clientWidth * 0.85));
        var one = card.getBoundingClientRect().width + gap;
        /* Category circles: advance a few at a time so the row doesn't crawl. */
        if (isCircleRail) return one * 3;
        return one;
      }

      function syncFades() {
        if (!usesEdgeFades) return;
        var hasOverflow = overflowAmount() > 0;
        var max = track.scrollWidth - track.clientWidth;
        var left = hasOverflow && track.scrollLeft > 4;
        var right = hasOverflow && track.scrollLeft < max - 4;
        rail.classList.toggle("is-fade-left", left);
        rail.classList.toggle("is-fade-right", right);
      }

      function syncControls() {
        var hasOverflow = overflowAmount() > 0;
        var max = track.scrollWidth - track.clientWidth;
        var atStart = track.scrollLeft <= 4;
        var atEnd = max <= 4 || track.scrollLeft >= max - 4;
        if (prev) {
          prev.hidden = !hasOverflow;
          prev.disabled = atStart;
          prev.setAttribute("aria-disabled", atStart ? "true" : "false");
        }
        if (next) {
          next.hidden = !hasOverflow;
          next.disabled = atEnd;
          next.setAttribute("aria-disabled", atEnd ? "true" : "false");
        }
        syncFades();
        if (dotsHost) {
          if (!hasOverflow) {
            dotsHost.hidden = true;
            dotsHost.innerHTML = "";
            return;
          }
          var pages = Math.max(1, Math.ceil(track.scrollWidth / Math.max(track.clientWidth, 1)));
          dotsHost.hidden = false;
          dotsHost.innerHTML = "";
          for (var i = 0; i < Math.min(pages, 6); i++) {
            var d = document.createElement("span");
            if (i === 0) d.className = "is-active";
            dotsHost.appendChild(d);
          }
        }
      }

      function scrollByDir(dir) {
        var distance = dir * cardStep();
        if (!isCircleRail) {
          track.scrollBy({ left: distance, behavior: "smooth" });
          return;
        }
        var max = Math.max(0, track.scrollWidth - track.clientWidth);
        var target = Math.max(0, Math.min(max, track.scrollLeft + distance));
        var start = track.scrollLeft;
        var delta = target - start;
        if (Math.abs(delta) < 2) return;
        if (rail._tacScrollAnim) window.cancelAnimationFrame(rail._tacScrollAnim);
        var reduce =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
          track.scrollLeft = target;
          syncControls();
          return;
        }
        var t0 = null;
        var dur = 280;
        track.style.scrollSnapType = "none";
        function frame(now) {
          if (!t0) t0 = now;
          var p = Math.min(1, (now - t0) / dur);
          var ease = 1 - Math.pow(1 - p, 3);
          track.scrollLeft = start + delta * ease;
          if (p < 1) {
            rail._tacScrollAnim = window.requestAnimationFrame(frame);
          } else {
            track.style.scrollSnapType = "";
            rail._tacScrollAnim = 0;
            syncControls();
          }
        }
        rail._tacScrollAnim = window.requestAnimationFrame(frame);
      }

      function updateDots() {
        if (!dotsHost || dotsHost.hidden || !dotsHost.children.length) return;
        var max = track.scrollWidth - track.clientWidth;
        var ratio = max > 0 ? track.scrollLeft / max : 0;
        var idx = Math.round(ratio * (dotsHost.children.length - 1));
        Array.prototype.forEach.call(dotsHost.children, function (el, i) {
          el.classList.toggle("is-active", i === idx);
        });
      }

      if (prev) prev.addEventListener("click", function () { scrollByDir(-1); });
      if (next) next.addEventListener("click", function () { scrollByDir(1); });
      track.addEventListener("scroll", function () {
        updateDots();
        syncControls();
      }, { passive: true });
      rail._tacSyncRail = syncControls;
      syncControls();
      window.addEventListener("resize", syncControls);
    });
  }

  /** Parse #tac-category-data tree into { topLevel, flat } with descendant filter ids. */
  function readCategoryTree() {
    var source = document.getElementById("tac-category-data");
    if (!source) return { topLevel: [], flat: [] };
    var root = source.content
      ? source.content.querySelector("[data-tac-cat-tree]")
      : source.querySelector("[data-tac-cat-tree]");
    if (!root) {
      // Legacy flat <a data-tac-cat-name> dump
      var legacy = source.content
        ? source.content.querySelectorAll("[data-tac-cat-name]")
        : source.querySelectorAll("[data-tac-cat-name]");
      var list = [];
      Array.prototype.forEach.call(legacy, function (el) {
        var name = el.getAttribute("data-tac-cat-name");
        var id = el.getAttribute("data-tac-cat-id") || "";
        if (!name) return;
        list.push({
          id: id,
          name: name,
          url: el.getAttribute("href") || el.getAttribute("data-tac-cat-url") || "",
          image: el.getAttribute("data-tac-cat-image") || "",
          filter: id,
        });
      });
      return { topLevel: list, flat: list };
    }

    function walk(li) {
      var id = li.getAttribute("data-tac-cat-id") || "";
      var name = li.getAttribute("data-tac-cat-name") || "";
      var node = {
        id: id,
        name: name,
        url: li.getAttribute("data-tac-cat-url") || "",
        image: li.getAttribute("data-tac-cat-image") || "",
        children: [],
      };
      var childUl = null;
      for (var i = 0; i < li.children.length; i++) {
        if (li.children[i].tagName === "UL") {
          childUl = li.children[i];
          break;
        }
      }
      if (childUl) {
        Array.prototype.forEach.call(childUl.children, function (child) {
          if (child.tagName === "LI") node.children.push(walk(child));
        });
      }
      return node;
    }

    function collectIds(node, out) {
      if (node.id) out.push(String(node.id));
      node.children.forEach(function (c) {
        collectIds(c, out);
      });
      return out;
    }

    function flatten(node, out) {
      var ids = collectIds(node, []);
      out.push({
        id: node.id,
        name: node.name,
        url: node.url,
        image: node.image,
        filter: ids.join(" "),
      });
      node.children.forEach(function (c) {
        flatten(c, out);
      });
      return out;
    }

    var topLevel = [];
    Array.prototype.forEach.call(root.children, function (li) {
      if (li.tagName === "LI") topLevel.push(walk(li));
    });
    var flat = [];
    topLevel.forEach(function (n) {
      flatten(n, flat);
    });
    return {
      topLevel: topLevel.map(function (n) {
        return {
          id: n.id,
          name: n.name,
          url: n.url,
          image: n.image,
          filter: collectIds(n, []).join(" "),
        };
      }),
      flat: flat,
    };
  }

  function normPath(href) {
    var s = String(href || "");
    try {
      s = new URL(s, window.location.origin).pathname;
    } catch (e) {
      s = s.split("?")[0].split("#")[0];
    }
    if (s.length > 1 && s.charAt(s.length - 1) === "/") s = s.slice(0, -1);
    return s.toLowerCase();
  }

  /** Curated homepage categories rendered in the header pill rail. */
  function readHomepageCategories() {
    var links = document.querySelectorAll(
      ".tac-pills[data-tac-pill-rail] a.tac-pill[data-tac-home-image]",
    );
    return Array.prototype.map.call(links, function (a) {
      return {
        name: (a.textContent || "").replace(/\s+/g, " ").trim(),
        url: a.getAttribute("href") || "",
        image: a.getAttribute("data-tac-home-image") || "",
      };
    }).filter(function (c) {
      return c.name && c.url;
    });
  }

  /**
   * Homepage Buy by Category circles: same categories as the header pills.
   * Circle art comes from the homepage category images.
   */
  function initAutoCategories() {
    var cats = readHomepageCategories();

    document.querySelectorAll("[data-tac-auto-categories]").forEach(function (rail) {
      var track =
        rail.querySelector("[data-tac-auto-categories-track]") ||
        rail.querySelector("[data-tac-rail-track]");
      if (!track || !cats.length) return;

      var html = "";
      cats.forEach(function (c) {
        var face = c.image
          ? '<img src="' +
            c.image.replace(/"/g, "&quot;") +
            '" alt="' +
            c.name.replace(/"/g, "&quot;") +
            '" width="120" height="120" loading="lazy">'
          : '<span class="tac-cat-circle__initial" aria-hidden="true">' +
            c.name.charAt(0).toUpperCase() +
            "</span>";
        html +=
          '<a class="tac-cat-circle" href="' +
          c.url.replace(/"/g, "&quot;") +
          '"><span class="tac-cat-circle__face">' +
          face +
          '</span><span class="tac-cat-circle__label">' +
          c.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</span></a>";
      });

      track.innerHTML = html;
      rail.removeAttribute("data-tac-ready");
    });
  }

  /** Visible category tree, including path, so homepage filters can match URLs. */
  function fetchCategoryTreeWithCounts() {
    var q =
      "query CatTreeCounts { site { categoryTree { entityId name path productCount children { entityId name path productCount children { entityId name path productCount children { entityId name path productCount } } } } } }";
    return gqlFetch(q).then(function (data) {
      return (data && data.site && data.site.categoryTree) || [];
    });
  }

  function renderFilterPills(track, allLabel, cats) {
    var html = "";
    if (allLabel) {
      html +=
        '<button type="button" class="tac-pill is-active" data-tac-filter="all" aria-selected="true">' +
        allLabel.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
        "</button>";
    }
    cats.forEach(function (c) {
      var label = c.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (c.filter) {
        html +=
          '<button type="button" class="tac-pill" data-tac-filter="' +
          String(c.filter).replace(/"/g, "&quot;") +
          '" aria-selected="false">' +
          label +
          "</button>";
        return;
      }
      if (c.url) {
        html +=
          '<a class="tac-pill" href="' +
          String(c.url).replace(/"/g, "&quot;") +
          '">' +
          label +
          "</a>";
      }
    });
    track.innerHTML = html;
  }

  /**
   * Keep homepage filter pills in the same order as the header category set.
   * Match each URL to the live tree so the product row can filter by id.
   */
  function matchHomepageFilters(nodes, homeCats) {
    var flat = [];
    function walk(list) {
      (list || []).forEach(function (node) {
        if (!node) return;
        flat.push(node);
        walk(node.children);
      });
    }
    walk(nodes);

    function subtreeIds(node, ids) {
      if (node.entityId) ids.push(String(node.entityId));
      (node.children || []).forEach(function (child) {
        subtreeIds(child, ids);
      });
      return ids;
    }

    return homeCats.map(function (c) {
      var path = normPath(c.url);
      var node = null;
      for (var i = 0; i < flat.length; i++) {
        if (normPath(flat[i].path || flat[i].url || "") === path) {
          node = flat[i];
          break;
        }
      }
      return {
        name: c.name,
        url: c.url,
        filter: node && node.entityId ? subtreeIds(node, []).join(" ") : "",
      };
    });
  }

  /**
   * Products Header filter pills when data-tac-auto-filters is set.
   * Same categories as the header pills. “All” stays the grid reset.
   */
  function initAutoFilters() {
    document.querySelectorAll("[data-tac-auto-filters]").forEach(function (root) {
      var track =
        root.querySelector("[data-tac-auto-filters-track]") ||
        root.querySelector("[data-tac-rail-track]");
      if (!track) return;

      var allLabel = root.getAttribute("data-tac-all-label") || "";
      var home = readHomepageCategories();

      function finish(cats) {
        renderFilterPills(track, allLabel, cats);
        if (typeof root._tacSyncRail === "function") {
          window.requestAnimationFrame(function () {
            root._tacSyncRail();
          });
        }
      }

      if (!home.length) {
        finish([]);
        return;
      }

      fetchCategoryTreeWithCounts()
        .then(function (tree) {
          finish(matchHomepageFilters(tree, home));
        })
        .catch(function () {
          var tree = readCategoryTree();
          finish(
            home.map(function (c) {
              var path = normPath(c.url);
              var node = tree.flat.filter(function (n) {
                return normPath(n.url) === path;
              })[0];
              return {
                name: c.name,
                url: c.url,
                filter: node && node.filter ? node.filter : "",
              };
            }),
          );
        });
    });
  }

  /** Mark the header category pill that matches the current path. */
  function initPillActive() {
    var track = document.querySelector(".tac-pills[data-tac-pill-rail] [data-tac-rail-track]");
    if (!track) return;
    var links = track.querySelectorAll("a.tac-pill");
    if (!links.length) return;

    function norm(p) {
      var s = String(p || "").split("?")[0].split("#")[0];
      if (!s) return "/";
      if (s.length > 1 && s.charAt(s.length - 1) === "/") s = s.slice(0, -1);
      return s || "/";
    }

    var path = norm(window.location.pathname);
    var best = null;
    var bestLen = -1;
    Array.prototype.forEach.call(links, function (a) {
      a.classList.remove("is-active");
      var href = norm(a.getAttribute("href"));
      if (href === path || (href !== "/" && path.indexOf(href + "/") === 0) || (href !== "/" && path === href)) {
        if (href.length > bestLen) {
          best = a;
          bestLen = href.length;
        }
      }
    });
    if (best) best.classList.add("is-active");
  }

  function sfConfig() {
    return window.__TAC_SF__ || {};
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Fetch products from Storefront GraphQL (live catalog — no curated ID list). */
  function gqlFetch(query, variables) {
    var token = sfConfig().token;
    if (!token) return Promise.reject(new Error("missing storefront GraphQL token"));
    return fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ query: query, variables: variables || {} }),
    }).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok || (json && json.errors && json.errors.length)) {
          var msg =
            (json && json.errors && json.errors[0] && json.errors[0].message) ||
            "GraphQL " + res.status;
          throw new Error(msg);
        }
        return json.data;
      });
    });
  }

  var PRODUCT_NODE_FIELDS =
    "entityId name path categories { edges { node { entityId } } } prices { price { formatted } basePrice { formatted } salePrice { formatted } } defaultImage { url(width: 480) altText } reviewSummary { numberOfReviews }";

  function fetchProductsForCategoryIds(ids, limit) {
    var first = Math.max(1, Math.min(limit || 24, 48));
    var unique = [];
    ids.forEach(function (id) {
      var n = parseInt(id, 10);
      if (n && unique.indexOf(n) === -1) unique.push(n);
    });
    if (!unique.length) return Promise.resolve([]);

    // Prefer the clicked category; if empty, walk descendants until we have cards.
    function productsFromCategory(entityId) {
      var q =
        "query CatProducts($id: Int!, $first: Int!) { site { category(entityId: $id) { products(first: $first) { edges { node { " +
        PRODUCT_NODE_FIELDS +
        " } } } } } }";
      return gqlFetch(q, { id: entityId, first: first }).then(function (data) {
        var edges =
          data &&
          data.site &&
          data.site.category &&
          data.site.category.products &&
          data.site.category.products.edges;
        return edges || [];
      });
    }

    return productsFromCategory(unique[0]).then(function (edges) {
      if (edges.length) return edges;
      // Parent may have no direct products — pull from child categories.
      var chain = Promise.resolve([]);
      unique.slice(1, 12).forEach(function (id) {
        chain = chain.then(function (acc) {
          if (acc.length >= first) return acc;
          return productsFromCategory(id).then(function (more) {
            var seen = {};
            acc.forEach(function (e) {
              if (e.node && e.node.entityId) seen[e.node.entityId] = true;
            });
            more.forEach(function (e) {
              if (!e.node || !e.node.entityId || seen[e.node.entityId]) return;
              if (acc.length >= first) return;
              seen[e.node.entityId] = true;
              acc.push(e);
            });
            return acc;
          });
        });
      });
      return chain;
    });
  }

  function fetchProductsAll(limit) {
    var first = Math.max(1, Math.min(limit || 24, 48));
    var q =
      "query AllProducts($first: Int!) { site { products(first: $first) { edges { node { " +
      PRODUCT_NODE_FIELDS +
      " } } } } }";
    return gqlFetch(q, { first: first }).then(function (data) {
      var edges = data && data.site && data.site.products && data.site.products.edges;
      return edges || [];
    });
  }

  function renderProductCards(edges) {
    var saleBadge = sfConfig().saleBadge || "";
    if (!edges.length) {
      return '<p class="tac-empty">No products in this category.</p>';
    }
    var html = "";
    edges.forEach(function (edge) {
      var node = edge && edge.node;
      if (!node || !node.defaultImage || !node.defaultImage.url) return;
      var catIds = "";
      if (node.categories && node.categories.edges) {
        catIds = node.categories.edges
          .map(function (c) {
            return c.node && c.node.entityId ? String(c.node.entityId) : "";
          })
          .filter(Boolean)
          .join(" ");
      }
      var priceHtml = "";
      if (node.prices && node.prices.salePrice && node.prices.salePrice.formatted) {
        priceHtml =
          '<span class="tac-product-card__price-sale">' +
          escapeHtml(node.prices.salePrice.formatted) +
          "</span>";
        if (node.prices.basePrice && node.prices.basePrice.formatted) {
          priceHtml +=
            '<span class="tac-product-card__price-was">' +
            escapeHtml(node.prices.basePrice.formatted) +
            "</span>";
        }
      } else if (node.prices && node.prices.price && node.prices.price.formatted) {
        priceHtml = escapeHtml(node.prices.price.formatted);
      }
      var badge = "";
      if (saleBadge && node.prices && node.prices.salePrice) {
        badge =
          '<span class="tac-product-card__badge">' + escapeHtml(saleBadge) + "</span>";
      }
      var reviews =
        node.reviewSummary && node.reviewSummary.numberOfReviews
          ? " (" + node.reviewSummary.numberOfReviews + ")"
          : "";
      html +=
        '<article class="tac-product-card" data-tac-product-card data-cats="' +
        escapeHtml(catIds) +
        '">' +
        badge +
        '<button type="button" class="tac-product-card__wish" aria-label="Save ' +
        escapeHtml(node.name) +
        ' to wishlist" data-tac-wish>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4l-1.4-1.3C5.4 14.1 2 11 2 7.5A4.4 4.4 0 016.4 3c1.7 0 3.3.9 4.2 2.2A5 5 0 0114.8 3 4.4 4.4 0 0119.2 7.5c0 3.5-3.4 6.6-8.6 11.6L12 20.4z"/></svg>' +
        "</button>" +
        '<a class="tac-product-card__link" href="' +
        escapeHtml(node.path) +
        '">' +
        '<div class="tac-product-card__art">' +
        '<img src="' +
        escapeHtml(node.defaultImage.url) +
        '" alt="' +
        escapeHtml(node.defaultImage.altText || node.name) +
        '" width="300" height="300" loading="lazy">' +
        "</div>" +
        '<h3 class="tac-product-card__title">' +
        escapeHtml(node.name) +
        "</h3>" +
        '<p class="tac-product-card__price">' +
        priceHtml +
        "</p>" +
        '<p class="tac-product-card__rating"><span class="tac-stars" aria-hidden="true">★★★★★</span>' +
        reviews +
        "</p>" +
        "</a></article>";
    });
    return html || '<p class="tac-empty">No products in this category.</p>';
  }

  function initTopCatFilters() {
    document.querySelectorAll("[data-tac-product-filters]").forEach(function (root) {
      if (root.getAttribute("data-tac-filters-bound") === "1") return;
      var grid = document.querySelector("[data-tac-product-grid]");
      if (!grid) return;
      root.setAttribute("data-tac-filters-bound", "1");
      var rail = grid.closest("[data-tac-product-rail]");
      var reqSeq = 0;

      function setActive(key) {
        root.querySelectorAll("[data-tac-filter]").forEach(function (p) {
          var on = p.getAttribute("data-tac-filter") === key;
          p.classList.toggle("is-active", on);
          p.setAttribute("aria-selected", on ? "true" : "false");
        });
      }

      function afterRender() {
        grid.scrollLeft = 0;
        initWishButtons();
        if (rail && typeof rail._tacSyncRail === "function") {
          window.requestAnimationFrame(function () {
            rail._tacSyncRail();
          });
        }
      }

      function applyFilter(key) {
        setActive(key);
        var seq = ++reqSeq;
        grid.classList.add("is-loading");
        var load =
          key === "all"
            ? fetchProductsAll(24)
            : fetchProductsForCategoryIds(String(key).split(/\s+/).filter(Boolean), 24);
        load
          .then(function (edges) {
            if (seq !== reqSeq) return;
            grid.innerHTML = renderProductCards(edges);
            grid.classList.remove("is-loading");
            afterRender();
          })
          .catch(function () {
            if (seq !== reqSeq) return;
            grid.classList.remove("is-loading");
            grid.innerHTML = '<p class="tac-empty">Unable to load products.</p>';
            afterRender();
          });
      }

      root.addEventListener("click", function (e) {
        var pill = e.target.closest("[data-tac-filter]");
        if (!pill || !root.contains(pill)) return;
        e.preventDefault();
        applyFilter(pill.getAttribute("data-tac-filter") || "all");
      });
    });
  }

  function initWishButtons() {
    document.querySelectorAll("[data-tac-wish]").forEach(function (btn) {
      if (btn.getAttribute("data-tac-ready") === "1") return;
      btn.setAttribute("data-tac-ready", "1");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var on = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", on ? "false" : "true");
      });
    });
  }

  /** Ace-like sticky chrome: shadow + slight compact after scroll. */
  function initStickyChrome() {
    var chrome = document.querySelector("[data-tac-chrome-sticky]");
    if (!chrome || chrome.getAttribute("data-tac-ready") === "1") return;
    chrome.setAttribute("data-tac-ready", "1");

    var ticking = false;
    function scrollY() {
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    function sync() {
      chrome.classList.toggle("is-scrolled", scrollY() > 8);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        sync();
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    sync();
  }

  /** Fixed Back to top control — show after scroll threshold; no third-party chat UI. */
  function initBackToTop() {
    var btn = document.querySelector("[data-tac-back-top]");
    if (!btn || btn.getAttribute("data-tac-ready") === "1") return;
    btn.setAttribute("data-tac-ready", "1");

    var threshold = parseInt(btn.getAttribute("data-tac-back-top-threshold"), 10);
    if (!threshold || threshold < 100) threshold = 480;

    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ticking = false;

    function scrollY() {
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function syncVisibility() {
      var show = scrollY() >= threshold;
      btn.classList.toggle("is-visible", show);
      btn.setAttribute("aria-hidden", show ? "false" : "true");
      btn.tabIndex = show ? 0 : -1;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        syncVisibility();
        ticking = false;
      });
    }

    function goTop() {
      if (reduceMotion) {
        window.scrollTo(0, 0);
      } else if (typeof window.scrollTo === "function") {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        } catch (err) {
          window.scrollTo(0, 0);
        }
      } else {
        window.scrollTo(0, 0);
      }

      var main = document.getElementById("main-content");
      var header = document.querySelector(".tac-brand, .tac-header, header");
      var focusTarget = header || main || document.body;
      if (focusTarget && typeof focusTarget.focus === "function") {
        var prevTab = focusTarget.getAttribute("tabindex");
        if (prevTab == null && focusTarget !== document.body) {
          focusTarget.setAttribute("tabindex", "-1");
        }
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (err2) {
          focusTarget.focus();
        }
      }
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      goTop();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    syncVisibility();
  }

  /**
   * Homepage scroll reveal — subtle fade + rise once as sections enter view.
   * Promo (above-the-fold) is skipped. Honours prefers-reduced-motion.
   */
  function initScrollReveal() {
    var home = document.querySelector(".tac-home[data-tac-scroll-reveal]");
    if (!home || home.getAttribute("data-tac-ready") === "1") return;
    home.setAttribute("data-tac-ready", "1");

    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function collectTargets() {
      var list = [];
      var regions = home.querySelectorAll(":scope > [data-content-region]");
      Array.prototype.forEach.call(regions, function (region) {
        var widgets = region.querySelectorAll("[data-widget-id]");
        if (widgets.length) {
          // Single-region homepage: reveal each widget; skip the first (usually above-the-fold promo).
          Array.prototype.forEach.call(widgets, function (w, index) {
            if (index === 0) return;
            list.push(w);
          });
          return;
        }
        if (region.children.length) list.push(region);
      });
      return list;
    }

    var targets = collectTargets();
    if (!targets.length) return;

    targets.forEach(function (el) {
      el.classList.add("tac-reveal-target");
    });

    if (reduceMotion || typeof window.IntersectionObserver !== "function") {
      targets.forEach(function (el) {
        el.classList.add("is-inview");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  function initShopMegaMenu() {
    var roots = document.querySelectorAll("[data-tac-mega]");
    if (!roots.length) return;

    roots.forEach(function (root) {
      if (root.getAttribute("data-tac-ready") === "1") return;
      root.setAttribute("data-tac-ready", "1");

      var toggle = root.querySelector("[data-tac-mega-toggle]");
      var panel = root.querySelector("[data-tac-mega-panel]");
      if (!toggle || !panel) return;

      function positionPanel() {
        if (window.matchMedia && window.matchMedia("(max-width: 899px)").matches) {
          var chrome = document.querySelector("[data-tac-chrome]") || root.closest(".tac-chrome");
          var bottom = chrome ? chrome.getBoundingClientRect().bottom : toggle.getBoundingClientRect().bottom;
          panel.style.top = Math.max(0, Math.round(bottom)) + "px";
        } else {
          panel.style.top = "";
        }
      }

      function setOpen(open) {
        root.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          positionPanel();
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
          panel.style.top = "";
        }
      }

      function close() {
        setOpen(false);
      }

      function open() {
        setOpen(true);
      }

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (root.classList.contains("is-open")) close();
        else open();
      });

      toggle.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" && !root.classList.contains("is-open")) {
          e.preventDefault();
          open();
          var first = panel.querySelector("a");
          if (first) first.focus();
        }
      });

      panel.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          toggle.focus();
        }
      });

      document.addEventListener("click", function (e) {
        if (!root.classList.contains("is-open")) return;
        if (root.contains(e.target)) return;
        close();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (!root.classList.contains("is-open")) return;
        close();
        toggle.focus();
      });
    });
  }

  /**
   * /brands/ — 7×3 pill carousel. The full catalog is printed with the page
   * (templates/components/common/tac-brand-catalog.html) so letters work on
   * the first paint. GraphQL is only a fallback when that list is empty.
   */
  function initBrandDirectory() {
    var root = document.querySelector("[data-tac-brand-directory]");
    if (!root || root.getAttribute("data-tac-ready") === "1") return;
    root.setAttribute("data-tac-ready", "1");

    var track = root.querySelector("[data-tac-brand-track]");
    var viewport = root.querySelector("[data-tac-brand-viewport]");
    var prev = root.querySelector("[data-tac-brand-prev]");
    var next = root.querySelector("[data-tac-brand-next]");
    var az = root.querySelector("[data-tac-brand-az]");
    var status = root.querySelector("[data-tac-brand-status]");
    if (!track || !viewport || !az || !status) return;

    var brands = [];
    var index = 0;
    var letter = "A";
    var chosen = null;
    var painted = false;
    var catalogReady = false;
    var slideTimer = 0;
    var SLIDE_MS = 380;

    function reducedMotion() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function displayName(name) {
      return String(name || "").replace(/[A-Za-z0-9]+/g, function (word) {
        if (word.length <= 3 && word === word.toUpperCase()) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    }

    function brandLetter(name) {
      var ch = String(name || "").trim().charAt(0).toUpperCase();
      if (ch >= "A" && ch <= "Z") return ch;
      return "#";
    }

    function letters() {
      var keys = ["#"];
      for (var i = 0; i < 26; i++) keys.push(String.fromCharCode(65 + i));
      return keys;
    }

    function sortBrands(list) {
      return list.slice().sort(function (a, b) {
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
      });
    }

    function dedupe(list) {
      var seen = {};
      var out = [];
      list.forEach(function (b) {
        if (!b || !b.name || !b.url || seen[b.url]) return;
        seen[b.url] = true;
        out.push({ name: String(b.name), url: String(b.url) });
      });
      return sortBrands(out);
    }

    function colsPerView() {
      var raw = parseInt(window.getComputedStyle(track).getPropertyValue("--tac-brand-cols"), 10);
      if (raw === 2 || raw === 4 || raw === 7) return raw;
      var width = viewport.clientWidth || window.innerWidth || 0;
      if (width >= 960) return 7;
      if (width >= 640) return 4;
      return 2;
    }

    function pageSize() {
      return colsPerView() * 3;
    }

    function paintAz() {
      var counts = {};
      brands.forEach(function (b) {
        var key = brandLetter(b.name);
        counts[key] = (counts[key] || 0) + 1;
      });
      az.innerHTML = letters()
        .map(function (key) {
          var count = counts[key] || 0;
          var active = key === letter;
          var locked = catalogReady && !count;
          return (
            '<button type="button" data-letter="' +
            key +
            '"' +
            (locked ? " disabled" : "") +
            (active ? ' class="is-active" aria-current="true"' : "") +
            ">" +
            key +
            "</button>"
          );
        })
        .join("");
    }

    function buildPage() {
      var per = pageSize();
      var maxStart = Math.max(0, brands.length - 1);
      if (index > maxStart) index = maxStart;
      if (index < 0) index = 0;
      var list = brands.slice(index, index + per);
      var cols = colsPerView();
      var page = document.createElement("div");
      page.className = "tac-brand-directory__page";
      page.innerHTML = list
        .map(function (b, i) {
          var row = Math.floor(i / cols);
          var col = i % cols;
          var tone = (row + col) % 2 === 0 ? "is-navy" : "is-soft";
          return (
            '<a class="tac-brand-chip ' +
            tone +
            '" href="' +
            escapeHtml(b.url) +
            '" title="' +
            escapeHtml(b.name) +
            '">' +
            escapeHtml(displayName(b.name)) +
            "</a>"
          );
        })
        .join("");
      return page;
    }

    function placePage(page) {
      track.innerHTML = "";
      track.style.height = "";
      track.appendChild(page);
    }

    function readEmbedded() {
      var el = document.getElementById("tac-brand-catalog");
      if (!el) return [];
      try {
        var data = JSON.parse(el.textContent || "[]");
        if (!Array.isArray(data)) return [];
        return data.filter(function (b) {
          return b && b.name && b.url;
        });
      } catch (err) {
        return [];
      }
    }

    function markLetter() {
      letter = brands[index] ? brandLetter(brands[index].name) : letter;
      Array.prototype.forEach.call(az.querySelectorAll("button[data-letter]"), function (btn) {
        var on = btn.getAttribute("data-letter") === letter;
        btn.classList.toggle("is-active", on);
        if (on) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
    }

    function sync() {
      var per = pageSize();
      var shown = brands.length ? Math.min(per, brands.length - index) : 0;
      var leftOn = index > 0;
      var rightOn = index + per < brands.length;
      viewport.classList.toggle("is-fade-left", leftOn);
      viewport.classList.toggle("is-fade-right", rightOn);
      if (prev) {
        prev.disabled = !leftOn;
        prev.setAttribute("aria-disabled", leftOn ? "false" : "true");
      }
      if (next) {
        next.disabled = !rightOn;
        next.setAttribute("aria-disabled", rightOn ? "false" : "true");
      }
      markLetter();
      if (!brands.length) {
        status.textContent = "No brands to show.";
        return;
      }
      var start = index + 1;
      var end = index + shown;
      var range = start === end ? String(start) : start + "–" + end;
      status.textContent = "Showing " + letter + " — " + range + " of " + brands.length;
    }

    function pinPage(el, xPercent) {
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";
      el.style.width = "100%";
      el.style.margin = "0";
      el.style.transform = "translate3d(" + xPercent + "%,0,0)";
    }

    function showPage(nextIndex, animate) {
      var maxStart = Math.max(0, brands.length - 1);
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex > maxStart) nextIndex = maxStart;
      window.clearTimeout(slideTimer);
      var pending = track.querySelectorAll(".tac-brand-directory__page");
      if (pending.length > 1) {
        var keep = pending[pending.length - 1];
        Array.prototype.forEach.call(pending, function (el) {
          if (el !== keep) el.parentNode.removeChild(el);
        });
        keep.style.cssText = "";
        track.style.height = "";
      }
      var outgoing = track.querySelector(".tac-brand-directory__page");
      var canSlide = animate && painted && !reducedMotion() && outgoing && nextIndex !== index;
      if (!canSlide) {
        index = nextIndex;
        placePage(buildPage());
        sync();
        painted = true;
        return;
      }
      var dir = nextIndex > index ? 1 : -1;
      var height = outgoing.offsetHeight;
      index = nextIndex;
      var incoming = buildPage();
      track.style.height = height + "px";
      pinPage(outgoing, 0);
      outgoing.style.transition = "none";
      pinPage(incoming, dir * 100);
      incoming.style.transition = "none";
      outgoing.setAttribute("aria-hidden", "true");
      track.appendChild(incoming);
      incoming.offsetWidth;
      var ease = "transform " + SLIDE_MS + "ms ease";
      outgoing.style.transition = ease;
      incoming.style.transition = ease;
      window.requestAnimationFrame(function () {
        outgoing.style.transform = "translate3d(" + -dir * 100 + "%,0,0)";
        incoming.style.transform = "translate3d(0,0,0)";
      });
      slideTimer = window.setTimeout(function () {
        if (outgoing.parentNode) outgoing.parentNode.removeChild(outgoing);
        incoming.style.cssText = "";
        track.style.height = "";
      }, SLIDE_MS + 50);
      sync();
      painted = true;
    }

    function showLetter(key, animate) {
      if (letters().indexOf(key) === -1) return;
      chosen = key;
      var at = -1;
      for (var i = 0; i < brands.length; i++) {
        if (brandLetter(brands[i].name) === key) {
          at = i;
          break;
        }
      }
      if (at < 0) {
        if (!catalogReady) {
          letter = key;
          markLetter();
          status.textContent = "Loading " + key + "…";
        }
        return;
      }
      showPage(at, animate);
    }

    function scrollPage(dir) {
      showPage(index + dir * pageSize(), true);
    }

    function bootList(list) {
      if (!root.isConnected) return;
      brands = dedupe(list);
      catalogReady = true;
      paintAz();
      if (chosen) showLetter(chosen, false);
      else showPage(0, false);
    }

    function loadGraphql() {
      var q =
        "query Brands($first: Int!, $after: String) { site { brands(first: $first, after: $after) { pageInfo { hasNextPage endCursor } edges { node { name path } } } } }";
      var acc = [];
      var pages = 0;
      function step(after) {
        pages += 1;
        if (pages > 30) return Promise.resolve(acc);
        return gqlFetch(q, { first: 50, after: after || null }).then(function (data) {
          var conn = data && data.site && data.site.brands;
          var edges = (conn && conn.edges) || [];
          edges.forEach(function (edge) {
            var node = edge && edge.node;
            if (!node || !node.name || !node.path) return;
            acc.push({ name: node.name, url: node.path });
          });
          if (conn && conn.pageInfo && conn.pageInfo.hasNextPage && conn.pageInfo.endCursor) {
            return step(conn.pageInfo.endCursor);
          }
          return acc;
        });
      }
      return step(null);
    }

    az.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button[data-letter]") : null;
      if (!btn || btn.disabled) return;
      showLetter(btn.getAttribute("data-letter"), false);
    });
    if (prev) {
      prev.addEventListener("click", function () {
        scrollPage(-1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        scrollPage(1);
      });
    }
    var lastCols = 0;
    function onResize() {
      var cols = colsPerView();
      if (cols === lastCols) return;
      lastCols = cols;
      if (painted) showPage(index, false);
    }
    if (window.ResizeObserver) {
      new ResizeObserver(onResize).observe(viewport);
    } else {
      window.addEventListener("resize", onResize);
    }

    var embedded = readEmbedded();
    if (embedded.length) {
      bootList(embedded);
    } else {
      status.textContent = "Loading brands…";
      if (prev) prev.disabled = true;
      if (next) next.disabled = true;
      loadGraphql()
        .then(function (list) {
          if (!list || !list.length || !root.isConnected) {
            status.textContent = "Brands could not be loaded.";
            return;
          }
          bootList(list);
        })
        .catch(function () {
          if (!brands.length) status.textContent = "Brands could not be loaded.";
        });
    }
  }

  document.addEventListener("tac-pb-hydrated", initWishButtons);
  document.addEventListener("tac-pb-hydrated", initBrandDirectory);

  var NEWSLETTER_ENDPOINT = "https://platform.tac-usa.com/newsletter/signup";
  var NEWSLETTER_TURNSTILE_SITEKEY = "0x4AAAAAAFUYAFpD4qtvqaqc";

  /** Email-only newsletter signup (footer form). */
  function initNewsletterSignup() {
    var form = document.getElementById("tac-newsletter-form");
    if (!form || form.getAttribute("data-tac-newsletter-bound") === "1") return;
    form.setAttribute("data-tac-newsletter-bound", "1");

    var button = form.querySelector('button[type="submit"]');
    var feedback = form.querySelector(".tac-newsletter-error");
    var host = document.getElementById("tac-newsletter-turnstile");
    var widgetId = null;
    var revealed = false;
    var lastError = "";
    var succeeded = false;

    function showError(message) {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.hidden = false;
    }

    function clearError() {
      if (!feedback) return;
      feedback.textContent = "";
      feedback.hidden = true;
    }

    function explain(code) {
      var c = String(code || "");
      var hostName = window.location.hostname;
      if (c === "script") {
        return "The Cloudflare security check didn't load. Reload the page.";
      }
      if (c === "110200" || c === "400021") {
        return "Cloudflare blocked the security check for " + hostName + " (error " + c + ").";
      }
      if (c === "unsupported") {
        return "This browser can't run the Cloudflare security check.";
      }
      if (!c) return "Cloudflare couldn't finish the security check.";
      return "Cloudflare couldn't finish the security check (error " + c + ").";
    }

    function renderTurnstile(appearance) {
      if (!host || !window.turnstile) return;
      if (widgetId !== null) {
        try {
          window.turnstile.remove(widgetId);
        } catch (error) {}
        widgetId = null;
      }
      host.innerHTML = "";
      if (appearance === "always") host.classList.add("is-revealed");
      try {
        widgetId = window.turnstile.render(host, {
          sitekey: NEWSLETTER_TURNSTILE_SITEKEY,
          appearance: appearance,
          size: appearance === "always" ? "normal" : "compact",
          theme: "dark",
          callback: function () {
            succeeded = true;
            lastError = "";
            clearError();
          },
          "error-callback": function (code) {
            if (succeeded) return;
            succeeded = false;
            lastError = String(code || "");
            showError(explain(lastError));
            if (!revealed) {
              revealed = true;
              setTimeout(function () {
                renderTurnstile("always");
              }, 0);
            }
          },
          "timeout-callback": function () {
            succeeded = false;
            lastError = "110600";
            showError(explain(lastError));
            if (!revealed) {
              revealed = true;
              setTimeout(function () {
                renderTurnstile("always");
              }, 0);
            }
          },
          "unsupported-callback": function () {
            succeeded = false;
            lastError = "unsupported";
            showError(explain(lastError));
          },
          "expired-callback": function () {
            succeeded = false;
            if (window.turnstile && widgetId !== null) {
              try {
                window.turnstile.reset(widgetId);
              } catch (error) {}
            }
          },
        });
      } catch (error) {
        if (!lastError) lastError = "script";
        showError(explain(lastError));
      }
    }

    function startTurnstile() {
      window.__tacNewsletterRender = function () {
        if (widgetId !== null || revealed) return;
        renderTurnstile("interaction-only");
      };
      if (
        window.__tacTurnstileReady ||
        (window.turnstile && typeof window.turnstile.render === "function")
      ) {
        window.__tacNewsletterRender();
        return;
      }
      var waited = 0;
      var timer = setInterval(function () {
        waited += 200;
        if (window.turnstile && typeof window.turnstile.render === "function") {
          clearInterval(timer);
          window.__tacNewsletterRender();
        } else if (waited >= 8000) {
          clearInterval(timer);
          if (widgetId === null && !lastError) {
            lastError = "script";
            showError(explain(lastError));
          }
        }
      }, 200);
    }

    startTurnstile();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!button || button.disabled) return;
      clearError();

      var fields = new FormData(form);
      var email = String(fields.get("email") || "").trim();
      var token = "";
      if (window.turnstile && widgetId !== null) {
        try {
          token = window.turnstile.getResponse(widgetId) || "";
        } catch (error) {}
      }
      if (!token) token = String(fields.get("cf-turnstile-response") || "");

      if (!email) {
        showError("Enter your email address.");
        if (form.elements.email) form.elements.email.focus();
        return;
      }

      if (!token) {
        if (lastError) showError(explain(lastError));
        else if (!window.turnstile) showError(explain("script"));
        else showError("The security check is still running.");
        if (lastError && !revealed && lastError !== "script" && lastError !== "unsupported") {
          revealed = true;
          renderTurnstile("always");
        }
        return;
      }

      button.disabled = true;
      var originalLabel = button.textContent;
      button.textContent = "Sending…";
      var redirecting = false;

      try {
        var response = await fetch(NEWSLETTER_ENDPOINT, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            "cf-turnstile-response": token,
            page_url: window.location.href,
            website: String(fields.get("website") || ""),
          }),
        });
        var result = await response.json().catch(function () {
          return null;
        });

        if (!response.ok || !result || result.accepted !== true) {
          showError((result && result.message) || "We couldn't save your signup. Try again.");
          return;
        }

        var target = new URL("/newsletter-pending", window.location.origin);
        if (typeof result.pending_redirect === "string" && result.pending_redirect) {
          var path = result.pending_redirect;
          if (path.charAt(0) !== "/") path = "/" + path;
          try {
            var requested = new URL(path, window.location.origin);
            if (requested.origin === window.location.origin) target = requested;
          } catch (error) {}
        }

        window.location.assign(target.href);
        redirecting = true;
      } catch (error) {
        showError("We couldn't reach the signup service. Try again.");
      } finally {
        if (!redirecting) {
          button.disabled = false;
          button.textContent = originalLabel || "Subscribe";
          if (window.turnstile && widgetId !== null) {
            try {
              window.turnstile.reset(widgetId);
            } catch (error) {
              showError("Reload the page to restart the security check.");
            }
          }
        }
      }
    });
  }

  /**
   * Paint the brand word ASSURANCE green wherever “Technology Assurance Cooperative” appears as text.
   * Skips nodes already marked, and non-content shells (script/style/inputs).
   */
  function styleAssuranceWord() {
    var roots = document.querySelectorAll("main, .tac-footer, .tac-main");
    var pattern = /(Technology\s+)(ASSURANCE|Assurance)(\s+Cooperative)/gi;
    roots.forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var matches = [];
      while (walker.nextNode()) {
        var node = walker.currentNode;
        var parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest("script, style, code, pre, textarea, [contenteditable], .tac-assurance, [data-tac-assurance]")) {
          continue;
        }
        var found = Array.from(String(node.data || "").matchAll(pattern));
        if (found.length) matches.push([node, found]);
      }
      matches.forEach(function (entry) {
        var node = entry[0];
        entry[1]
          .slice()
          .reverse()
          .forEach(function (match) {
            var word = node.splitText(match.index + match[1].length);
            word.splitText(match[2].length);
            var label = document.createElement("span");
            label.className = "tac-assurance";
            label.setAttribute("data-tac-assurance", "");
            label.textContent = match[2];
            word.parentNode.replaceChild(label, word);
          });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    stripWorkgridArtifacts();
    initPromoCarousels();
    initPanelCarousels();
    initAutoCategories();
    initAutoFilters();
    initRails();
    initPillActive();
    initTopCatFilters();
    initWishButtons();
    initStickyChrome();
    initShopMegaMenu();
    initBackToTop();
    initScrollReveal();
    initBrandDirectory();
    styleAssuranceWord();
    initNewsletterSignup();
  });
  document.addEventListener("tac-pb-hydrated", styleAssuranceWord);
  document.addEventListener("tac-pb-hydrated", initNewsletterSignup);
  stripWorkgridArtifacts();
})();
