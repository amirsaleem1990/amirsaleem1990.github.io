/**
 * Fill Experience + Projects from WORK HISTORY in the resume PDF.
 * Update AmirSaleem_DataScience_Resume.pdf — the page picks up new wording on reload.
 */
(function () {
  var RESUME_URL = "AmirSaleem_DataScience_Resume.pdf";
  // Local copies — avoid CDN/worker failures on GitHub Pages and offline.
  var PDFJS_DIR = "index_files/pdfjs";
  var PDFJS_MAIN = PDFJS_DIR + "/pdf.min.js";
  var PDFJS_WORKER = PDFJS_DIR + "/pdf.worker.min.js";

  // Optional company profile links only (not bullet copy).
  var COMPANY_LINKS = {
    Turing: "https://www.linkedin.com/company/turingcom/",
    Medusa: "https://www.linkedin.com/company/medusadistribution/",
    LoveForData: "https://www.linkedin.com/company/lovefordata"
  };

  var TECH_KEYWORDS = [
    ["Apache Airflow", "APACHE AIRFLOW"],
    ["Apache Kafka", "APACHE KAFKA"],
    ["Amazon Redshift", "AMAZON REDSHIFT"],
    ["AWS Glue", "AWS GLUE"],
    ["AWS Lambda", "AWS LAMBDA"],
    ["CloudWatch", "CLOUDWATCH"],
    ["Bitbucket", "BITBUCKET"],
    ["GraphQL", "GRAPHQL"],
    ["Monday.com", "MONDAY.COM"],
    ["Azure Functions", "AZURE FUNCTIONS"],
    ["scikit-learn", "SCIKIT-LEARN"],
    ["PyTorch", "PYTORCH"],
    ["TensorFlow", "TENSORFLOW"],
    ["R-Shiny", "R-SHINY"],
    ["R Shiny", "R SHINY"],
    ["PostgreSQL", "POSTGRESQL"],
    ["MongoDB", "MONGODB"],
    ["Redshift", "REDSHIFT"],
    ["Athena", "ATHENA"],
    ["MySQL", "MYSQL"],
    ["Docker", "DOCKER"],
    ["Django", "DJANGO"],
    ["FastAPI", "FASTAPI"],
    ["LangChain", "LANGCHAIN"],
    ["Selenium", "SELENIUM"],
    ["Pandas", "PANDAS"],
    ["Python", "PYTHON"],
    ["PySpark", "PYSPARK"],
    ["Airflow", "AIRFLOW"],
    ["Kafka", "KAFKA"],
    ["AWS", "AWS"],
    ["Azure", "AZURE"],
    ["SQL", "SQL"],
    ["ETL", "ETL"],
    ["RAG", "RAG"],
    ["LLM", "LLM"],
    ["GPT-4", "GPT-4"],
    ["NLP", "NLP"],
    ["CI/CD", "CI/CD"],
    ["EDA", "EDA"],
    ["TF-IDF", "TF-IDF"],
    ["MLOps", "MLOPS"],
    ["Machine Learning", "MACHINE LEARNING"],
    ["Feature Engineering", "FEATURE ENGINEERING"],
    ["Web Scraping", "WEB SCRAPING"],
    ["Data Quality", "DATA QUALITY"],
    ["Forecasting", "FORECASTING"],
    ["Market Basket", "MARKET BASKET"]
  ];

  var ACTION_START =
    /^(Managed|Integrated|Deployed|Implemented|Designed|Performed|Built|Developed|Applied|Shipped|Automated|Collected|Enhanced|Evaluated|Improved|Ran|Created|Led|Owned|Engineered|Contributed|Delivered|Reviewed|Analyzed|Identified|Configured|Maintained|Orchestrated|Migrated|Optimized|Reduced|Increased|Supported|Established)\b/;
  var TITLED_START = /^[A-Z][^:]{2,90}?\s*:\s+\S/;
  var JOB_LINE =
    /^(.+ @ \S+(?:\s+\([^)]+\))?)\s+(.+?\|\s*[A-Za-z]+\s+\d{4}\s*-\s*[A-Za-z]+\s+\d{4})\s*$/;
  var JOB_HEADER_ONLY = /^.+ @ .+$/;
  var JOB_META_ONLY = /^.+\|\s*[A-Za-z]+\s+\d{4}\s*-\s*[A-Za-z]+\s+\d{4}\s*$/;
  var MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cleanText(s) {
    return String(s)
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/([A-Za-z])\s+-\s*([A-Za-z])/g, "$1-$2")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function inferTags(text) {
    var upper = text.toUpperCase();
    var tags = [];
    var seen = {};
    TECH_KEYWORDS.forEach(function (pair) {
      var needle = pair[0].toUpperCase();
      var label = pair[1];
      if (upper.indexOf(needle) !== -1 && !seen[label]) {
        seen[label] = true;
        tags.push(label);
      }
    });
    if (!tags.length) tags.push("DATA");
    return tags.slice(0, 6).join(" • ");
  }

  function titleFromDescription(desc) {
    var words = desc
      .replace(/[^a-zA-Z0-9\s&/-]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 8);
    var title = words.join(" ");
    if (desc.length > title.length) title += "…";
    return title;
  }

  function parseDatePart(part) {
    var m = String(part).trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (!m) return null;
    var month = MONTHS[m[1].toLowerCase()];
    if (month == null) return null;
    return new Date(Number(m[2]), month, 1);
  }

  function formatDuration(datesText) {
    var parts = String(datesText).split(/\s*-\s*/);
    if (parts.length !== 2) return "";
    var start = parseDatePart(parts[0]);
    var end = parseDatePart(parts[1]);
    if (!start || !end) return "";
    var months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1;
    if (months < 1) months = 1;
    var years = Math.floor(months / 12);
    var rem = months % 12;
    if (years && rem) {
      return (
        "(" +
        years +
        " year" +
        (years === 1 ? "" : "s") +
        ", " +
        rem +
        " month" +
        (rem === 1 ? "" : "s") +
        ")"
      );
    }
    if (years) {
      return "(" + years + " year" + (years === 1 ? "" : "s") + ")";
    }
    return "(" + rem + " month" + (rem === 1 ? "" : "s") + ")";
  }

  function splitRoleCompany(header) {
    var idx = header.lastIndexOf(" @ ");
    if (idx === -1) return { role: header, company: "" };
    return {
      role: header.slice(0, idx).trim(),
      company: header.slice(idx + 3).trim()
    };
  }

  function splitLocationDates(meta) {
    var idx = meta.lastIndexOf("|");
    if (idx === -1) return { location: meta, dates: "" };
    return {
      location: meta.slice(0, idx).trim(),
      dates: meta.slice(idx + 1).trim()
    };
  }

  function parseBullets(lines) {
    var bullets = [];
    var buf = "";
    lines.forEach(function (ln) {
      if (!buf) {
        buf = ln;
        return;
      }
      if (TITLED_START.test(ln) || ACTION_START.test(ln)) {
        bullets.push(buf);
        buf = ln;
        return;
      }
      buf += " " + ln;
    });
    if (buf) bullets.push(buf);
    return bullets.map(cleanText);
  }

  function parseWorkHistory(fullText) {
    var match = fullText.match(/WORK HISTORY([\s\S]*?)CERTIFICATIONS/);
    if (!match) return [];

    var lines = match[1]
      .split(/\n/)
      .map(function (ln) {
        return ln.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean);

    var jobs = [];
    var cur = null;

    lines.forEach(function (ln) {
      var combined = ln.match(JOB_LINE);
      if (combined) {
        cur = { header: combined[1].trim(), meta: combined[2].trim(), lines: [] };
        jobs.push(cur);
        return;
      }
      if (JOB_HEADER_ONLY.test(ln) && !/\.\s*$/.test(ln) && ln.indexOf(":") === -1) {
        cur = { header: ln, meta: "", lines: [] };
        jobs.push(cur);
        return;
      }
      if (!cur) return;
      if (!cur.meta && JOB_META_ONLY.test(ln) && ln.length < 100) {
        cur.meta = ln;
        return;
      }
      cur.lines.push(ln);
    });

    return jobs.map(function (job) {
      var rc = splitRoleCompany(cleanText(job.header));
      var ld = splitLocationDates(cleanText(job.meta));
      var bullets = parseBullets(job.lines);
      return {
        role: rc.role,
        company: rc.company,
        location: ld.location,
        dates: ld.dates,
        duration: formatDuration(ld.dates),
        header: cleanText(job.header),
        meta: cleanText(job.meta),
        bullets: bullets,
        companyUrl: COMPANY_LINKS[rc.company] || ""
      };
    });
  }

  function jobsToProjects(jobs) {
    var projects = [];
    jobs.forEach(function (job) {
      job.bullets.forEach(function (bullet) {
        var title = "";
        var description = bullet;
        var titled = bullet.match(/^([^:]{3,90}?)\s*:\s+([\s\S]+)$/);
        if (
          titled &&
          /[A-Za-z]/.test(titled[1]) &&
          titled[1].split(/\s+/).length <= 12
        ) {
          title = cleanText(titled[1]);
          description = cleanText(titled[2]);
        } else {
          title = titleFromDescription(description);
        }
        projects.push({
          title: title,
          description: description,
          role: job.header,
          meta: job.meta,
          tags: inferTags(title + " " + description + " " + job.header),
          featured: !!titled
        });
      });
    });
    return projects;
  }

  function formatBulletHtml(bullet) {
    var titled = bullet.match(/^([^:]{3,90}?)\s*:\s+([\s\S]+)$/);
    if (
      titled &&
      /[A-Za-z]/.test(titled[1]) &&
      titled[1].split(/\s+/).length <= 12
    ) {
      return (
        "<li><strong>" +
        escapeHtml(cleanText(titled[1])) +
        ":</strong> " +
        escapeHtml(cleanText(titled[2])) +
        "</li>"
      );
    }
    return "<li>" + escapeHtml(bullet) + "</li>";
  }

  function renderExperience(jobs, container) {
    if (!jobs.length) {
      container.innerHTML =
        '<p class="text-center">No experience found in resume. <a href="' +
        escapeHtml(RESUME_URL) +
        '" target="_blank" rel="noopener noreferrer">Open resume PDF</a>.</p>';
      return;
    }

    container.innerHTML = jobs
      .map(function (job) {
        var companyBlock;
        if (job.companyUrl) {
          companyBlock =
            '<a href="' +
            escapeHtml(job.companyUrl) +
            '" target="_blank" rel="noopener noreferrer">' +
            '<span class="position">' +
            escapeHtml(job.company) +
            "</span><br>" +
            '<span class="position2">' +
            escapeHtml(job.location) +
            "</span></a>";
        } else {
          companyBlock =
            '<span class="position">' +
            escapeHtml(job.company) +
            "</span><br>" +
            '<span class="position2">' +
            escapeHtml(job.location) +
            "</span>";
        }

        return (
          '<div class="resume-wrap d-flex ftco-animate fadeInUp ftco-animated">' +
          '<div class="icon d-flex align-items-center justify-content-center">' +
          '<span class="flaticon-suitcase"></span></div>' +
          '<div class="text pl-3">' +
          "<h2>" +
          escapeHtml(job.role) +
          "</h2>" +
          companyBlock +
          '<p class="date">' +
          escapeHtml(job.dates) +
          (job.duration ? "<br>" + escapeHtml(job.duration) : "") +
          "</p>" +
          "<ul>" +
          job.bullets.map(formatBulletHtml).join("") +
          "</ul></div></div>"
        );
      })
      .join("");
  }

  function renderProjects(projects, container) {
    if (!projects.length) {
      container.innerHTML =
        '<div class="col-12"><p class="text-center">No projects found in resume. <a href="' +
        escapeHtml(RESUME_URL) +
        '" target="_blank" rel="noopener noreferrer">Open resume PDF</a>.</p></div>';
      return;
    }

    container.innerHTML = projects
      .map(function (p) {
        var col = p.featured ? "col-md-12" : "col-md-6";
        return (
          '<div class="' +
          col +
          ' text-left d-flex ftco-animate fadeInUp ftco-animated">' +
          '<a class="services-1 shadow w-100" href="' +
          escapeHtml(RESUME_URL) +
          '" target="_blank" rel="noopener noreferrer">' +
          '<div class="desc">' +
          '<h3 class="mc-4">' +
          escapeHtml(p.title) +
          "</h3>" +
          "<p><strong>" +
          escapeHtml(p.tags) +
          "</strong></p>" +
          '<p class="mb-2"><span class="position">' +
          escapeHtml(p.role) +
          "</span>" +
          (p.meta
            ? ' <span class="date">· ' + escapeHtml(p.meta) + "</span>"
            : "") +
          "</p>" +
          "<p>" +
          escapeHtml(p.description) +
          "</p>" +
          "</div></a></div>"
        );
      })
      .join("");
  }

  function setLoading(el, message) {
    if (!el) return;
    el.innerHTML =
      '<p class="text-center projects-loading-status">' +
      escapeHtml(message) +
      "</p>";
  }

  function resumeAbsoluteUrl() {
    try {
      return new URL(RESUME_URL, window.location.href).href;
    } catch (e) {
      return RESUME_URL;
    }
  }

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = PDFJS_MAIN;
      script.onload = function () {
        if (!window.pdfjsLib) {
          reject(new Error("pdf.js failed to initialize"));
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          PDFJS_WORKER,
          window.location.href
        ).href;
        resolve(window.pdfjsLib);
      };
      script.onerror = function () {
        reject(new Error("Failed to load local pdf.js from " + PDFJS_MAIN));
      };
      document.head.appendChild(script);
    });
  }

  async function extractPdfText(pdfjsLib, url) {
    var response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Failed to fetch resume PDF (" + response.status + ")");
    }
    var data = new Uint8Array(await response.arrayBuffer());
    var pdf = await pdfjsLib.getDocument({ data: data }).promise;
    var parts = [];
    for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      var page = await pdf.getPage(pageNum);
      var content = await page.getTextContent();
      var lastY = null;
      var pageText = [];
      content.items.forEach(function (item) {
        var y = item.transform ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
          pageText.push("\n");
        } else if (
          pageText.length &&
          !/\s$/.test(pageText[pageText.length - 1]) &&
          !/^\s/.test(item.str)
        ) {
          pageText.push(" ");
        }
        pageText.push(item.str);
        lastY = y;
      });
      parts.push(pageText.join(""));
    }
    return parts.join("\n");
  }

  function showError(experienceEl, projectsEl) {
    var msg =
      'Could not load content from the resume PDF. <a href="' +
      escapeHtml(RESUME_URL) +
      '" target="_blank" rel="noopener noreferrer">Open resume</a> instead.';
    if (experienceEl) experienceEl.innerHTML = "<p class=\"text-center\">" + msg + "</p>";
    if (projectsEl) {
      projectsEl.innerHTML = '<div class="col-12"><p class="text-center">' + msg + "</p></div>";
    }
  }

  async function init() {
    var experienceEl = document.getElementById("experience-from-resume");
    var projectsEl = document.getElementById("projects-from-resume");
    if (!experienceEl && !projectsEl) return;

    setLoading(experienceEl, "Loading experience from resume…");
    if (projectsEl) {
      projectsEl.innerHTML =
        '<div class="col-12"><p class="text-center projects-loading-status">Loading projects from resume…</p></div>';
    }

    try {
      var pdfjsLib = await loadPdfJs();
      var text = await extractPdfText(pdfjsLib, resumeAbsoluteUrl());
      var jobs = parseWorkHistory(text);
      if (!jobs.length) {
        throw new Error("Parsed 0 jobs from resume WORK HISTORY");
      }
      if (experienceEl) renderExperience(jobs, experienceEl);
      if (projectsEl) renderProjects(jobsToProjects(jobs), projectsEl);
    } catch (err) {
      console.error("Resume content load failed:", err);
      showError(experienceEl, projectsEl);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
