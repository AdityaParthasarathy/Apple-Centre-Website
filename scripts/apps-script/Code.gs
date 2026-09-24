// Reference implementation for the Google Apps Script Web App backing this
// site's server-managed data (applications, faculty accounts, events,
// announcements, gallery). This file is NOT run by Next.js — it lives in
// your Google Sheet's Apps Script editor (Extensions > Apps Script). Copy
// it in, fill in the two constants below, and deploy as a Web App.
//
// See README.md in this folder for the full setup steps (sheet tabs,
// column headers, Drive folder, deployment).

var SECRET = 'REPLACE_WITH_YOUR_SECRET'; // must match GOOGLE_APPS_SCRIPT_SECRET in .env.local
var GALLERY_FOLDER_ID = 'REPLACE_WITH_YOUR_DRIVE_FOLDER_ID'; // the Drive folder gallery uploads go into

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, error: 'Invalid JSON body.' });
  }

  if (body.secret !== SECRET) {
    return jsonResponse({ success: false, error: 'Unauthorized.' });
  }

  try {
    switch (body.action) {
      case 'logApplication':
        return handleLogApplication(body);
      case 'listApplications':
        return handleListApplications();
      case 'updateApplicationStatus':
        return handleUpdateApplicationStatus(body);
      case 'deleteApplication':
        return handleDeleteApplication(body);
      case 'getFaculty':
        return handleGetFaculty(body);
      case 'listEvents':
        return handleListEvents();
      case 'addEvent':
        return handleAddEvent(body);
      case 'updateEvent':
        return handleUpdateEvent(body);
      case 'deleteEvent':
        return handleDeleteEvent(body);
      case 'listAnnouncements':
        return handleListAnnouncements();
      case 'addAnnouncement':
        return handleAddAnnouncement(body);
      case 'updateAnnouncement':
        return handleUpdateAnnouncement(body);
      case 'deleteAnnouncement':
        return handleDeleteAnnouncement(body);
      case 'uploadImage':
        return handleUploadImage(body);
      case 'listGallery':
        return handleListGallery();
      case 'addGalleryImage':
        return handleAddGalleryImage(body);
      case 'deleteGalleryImage':
        return handleDeleteGalleryImage(body);
      case 'listProjects':
        return handleListProjects();
      case 'addProject':
        return handleAddProject(body);
      case 'updateProject':
        return handleUpdateProject(body);
      case 'deleteProject':
        return handleDeleteProject(body);
      case 'registerForEvent':
        return handleRegisterForEvent(body);
      case 'listRegistrations':
        return handleListRegistrations();
      case 'listRegistrationCounts':
        return handleListRegistrationCounts();
      case 'deleteRegistration':
        return handleDeleteRegistration(body);
      case 'listAchievements':
        return handleListAchievements();
      case 'addAchievement':
        return handleAddAchievement(body);
      case 'updateAchievement':
        return handleUpdateAchievement(body);
      case 'deleteAchievement':
        return handleDeleteAchievement(body);
      case 'listTeamMembers':
        return handleListTeamMembers();
      case 'addTeamMember':
        return handleAddTeamMember(body);
      case 'updateTeamMember':
        return handleUpdateTeamMember(body);
      case 'deleteTeamMember':
        return handleDeleteTeamMember(body);
      case 'listPrograms':
        return handleListPrograms();
      case 'addProgram':
        return handleAddProgram(body);
      case 'updateProgram':
        return handleUpdateProgram(body);
      case 'deleteProgram':
        return handleDeleteProgram(body);
      case 'listFacilities':
        return handleListFacilities();
      case 'addFacility':
        return handleAddFacility(body);
      case 'updateFacility':
        return handleUpdateFacility(body);
      case 'deleteFacility':
        return handleDeleteFacility(body);
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + body.action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Generic sheet helpers — read/write by column HEADER NAME, not position, so
// column order in the actual spreadsheet doesn't matter. Every tab's first
// row must be the exact header names listed in README.md.
// ---------------------------------------------------------------------------

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet tab "' + name + '" not found. See README.md.');
  return sheet;
}

function readRows(sheetName) {
  var sheet = getSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) {
    return String(h).trim();
  });
  return values
    .slice(1)
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== '' && cell !== null;
      });
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        obj[header] = row[i];
      });
      return obj;
    });
}

// Every write goes through this — Apps Script runs concurrent requests to
// the same spreadsheet one at a time regardless, but without an explicit
// lock two overlapping executions can still interleave their read and write
// steps (one reads the sheet layout, the other changes it before the first
// writes), corrupting a cell or leaving one request waiting far longer than
// it should. Wrapping every mutation in a script lock makes each one fully
// atomic — acquire, do the read-modify-write, release — so they queue
// cleanly instead of racing.
function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function appendRow(sheetName, rowObject) {
  withLock(function () {
    appendRowUnlocked(sheetName, rowObject);
  });
}

// The write itself, without taking the lock — for a handler that has to read
// and write as one atomic step and so already holds it (the script lock isn't
// re-entrant, so calling appendRow from inside withLock would wait on itself).
function appendRowUnlocked(sheetName, rowObject) {
  var sheet = getSheet(sheetName);
  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) {
      return String(h).trim();
    });
  var row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(rowObject, header) ? rowObject[header] : '';
  });
  sheet.appendRow(row);
}

// A handful of early Applications rows got their id written as a plain
// ISO-timestamp string (e.g. "2026-08-02T09:21:01.720Z") before ids
// switched to UUIDs. Sheets auto-converts anything date-shaped into a real
// Date-typed cell regardless of which column it's in — readRows() then
// serializes that Date back to the same ISO string the client already has,
// so listing looks completely normal. But update/delete re-read the sheet
// and compared the raw cell with plain String(), and String(dateObject)
// produces "Sun Aug 02 2026 09:21:01 GMT+0000 (...)" — never equal to the
// ISO string being matched against, so the row was silently unfindable.
// Same normalization dateOnly()/isoString() already apply elsewhere.
function idsMatch(cellValue, id) {
  var cellStr = cellValue instanceof Date ? cellValue.toISOString() : String(cellValue);
  return cellStr === String(id);
}

function updateRowById(sheetName, id, updates) {
  return withLock(function () {
    var sheet = getSheet(sheetName);
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (h) {
      return String(h).trim();
    });
    var idCol = headers.indexOf('id');
    if (idCol === -1) throw new Error('Sheet "' + sheetName + '" has no "id" column.');

    for (var r = 1; r < values.length; r++) {
      if (idsMatch(values[r][idCol], id)) {
        Object.keys(updates).forEach(function (key) {
          var col = headers.indexOf(key);
          if (col !== -1) sheet.getRange(r + 1, col + 1).setValue(updates[key]);
        });
        return true;
      }
    }
    return false;
  });
}

function deleteRowById(sheetName, id) {
  return withLock(function () {
    var sheet = getSheet(sheetName);
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (h) {
      return String(h).trim();
    });
    var idCol = headers.indexOf('id');
    if (idCol === -1) throw new Error('Sheet "' + sheetName + '" has no "id" column.');

    for (var r = 1; r < values.length; r++) {
      if (idsMatch(values[r][idCol], id)) {
        sheet.deleteRow(r + 1);
        return true;
      }
    }
    return false;
  });
}

function generateId() {
  return Utilities.getUuid();
}

function dateOnly(value) {
  // Sheets auto-converts plain "YYYY-MM-DD" strings written into a cell
  // into a real Date, timestamped at midnight in the spreadsheet's own
  // timezone. Reading it back with .toISOString() converts to UTC first,
  // which silently shifts the date back a day whenever that timezone is
  // behind UTC. Formatting in the script's own timezone instead reads back
  // the same calendar date that was written.
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value || '');
}

function isoString(value) {
  if (value instanceof Date) return value.toISOString();
  return String(value || '');
}

function toBool(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

// ---------------------------------------------------------------------------
// Applications — the "Applications" tab already exists (the Apply form has
// been logging to it). This adds "id" and "status" columns to what's there;
// verify your existing headers match before relying on this.
// ---------------------------------------------------------------------------

function handleLogApplication(body) {
  var id = generateId();
  appendRow('Applications', {
    id: id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    year: body.year,
    skills: body.skills,
    project1Description: body.project1Description || '',
    project1SourceLink: body.project1SourceLink || '',
    project1LiveLink: body.project1LiveLink || '',
    project1Screenshot: body.project1Screenshot || '',
    project2Description: body.project2Description || '',
    project2SourceLink: body.project2SourceLink || '',
    project2LiveLink: body.project2LiveLink || '',
    project2Screenshot: body.project2Screenshot || '',
    project3Description: body.project3Description || '',
    project3SourceLink: body.project3SourceLink || '',
    project3LiveLink: body.project3LiveLink || '',
    project3Screenshot: body.project3Screenshot || '',
    status: 'Pending',
    submittedAt: new Date().toISOString(),
  });
  return jsonResponse({ success: true, id: id });
}

function handleListApplications() {
  var rows = readRows('Applications').map(function (row, idx) {
    return {
      id: row.id || 'row-' + (idx + 2),
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      year: row.year || '',
      skills: row.skills || '',
      project1Description: row.project1Description || '',
      project1SourceLink: row.project1SourceLink || '',
      project1LiveLink: row.project1LiveLink || '',
      project1Screenshot: row.project1Screenshot || '',
      project2Description: row.project2Description || '',
      project2SourceLink: row.project2SourceLink || '',
      project2LiveLink: row.project2LiveLink || '',
      project2Screenshot: row.project2Screenshot || '',
      project3Description: row.project3Description || '',
      project3SourceLink: row.project3SourceLink || '',
      project3LiveLink: row.project3LiveLink || '',
      project3Screenshot: row.project3Screenshot || '',
      status: row.status || 'Pending',
      submittedAt: isoString(row.submittedAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleUpdateApplicationStatus(body) {
  var ok = updateRowById('Applications', body.id, { status: body.status });
  if (!ok) return jsonResponse({ success: false, error: 'Application not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteApplication(body) {
  var ok = deleteRowById('Applications', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Application not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Faculty — accounts are provisioned by hand (see scripts/hash-password.mjs
// in the repo), never through a public signup flow.
// ---------------------------------------------------------------------------

function handleGetFaculty(body) {
  var rows = readRows('Faculty');
  var email = String(body.email || '').toLowerCase().trim();
  var match = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].email || '').toLowerCase().trim() === email) {
      match = rows[i];
      break;
    }
  }
  if (!match) return jsonResponse({ success: true, faculty: null });
  return jsonResponse({
    success: true,
    faculty: { email: match.email, passwordHash: match.password_hash, name: match.name },
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function handleListEvents() {
  var rows = readRows('Events').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      date: dateOnly(row.date),
      time: row.time,
      location: row.location,
      category: row.category,
      image: row.image,
      capacity: row.capacity ? Number(row.capacity) : undefined,
      published: row.published === '' || row.published === undefined ? true : toBool(row.published),
      pinned: toBool(row.pinned),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddEvent(body) {
  var id = body.id || generateId();
  var event = {
    id: id,
    title: body.title,
    description: body.description,
    date: body.date,
    time: body.time,
    location: body.location,
    category: body.category,
    image: body.image,
    capacity: body.capacity || '',
    published: body.published !== false,
    pinned: !!body.pinned,
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Events', event);
  return jsonResponse({ success: true, event: event });
}

function handleUpdateEvent(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('Events', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Event not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteEvent(body) {
  var ok = deleteRowById('Events', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Event not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

function handleListAnnouncements() {
  var rows = readRows('Announcements').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      published: toBool(row.published),
      pinned: toBool(row.pinned),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddAnnouncement(body) {
  var id = body.id || generateId();
  var announcement = {
    id: id,
    title: body.title,
    body: body.body,
    published: body.published !== false,
    pinned: !!body.pinned,
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Announcements', announcement);
  return jsonResponse({ success: true, announcement: announcement });
}

function handleUpdateAnnouncement(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('Announcements', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Announcement not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteAnnouncement(body) {
  var ok = deleteRowById('Announcements', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Announcement not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Gallery — images upload to Drive, the sheet row just stores a public URL.
// Deleting a gallery row does NOT delete the underlying Drive file (kept as
// a safety margin against accidental data loss); clean those up manually
// in Drive if you want the storage back.
// ---------------------------------------------------------------------------

// Rows created before the URL format fix still have the old
// drive.google.com/uc?export=view links, which Google frequently blocks
// when hotlinked cross-origin. Normalize on read so old rows display
// correctly without a data migration; new rows already come out of
// handleAddGalleryImage in the correct format and pass through unchanged.
function normalizeDriveImageUrl(url) {
  var match = /[?&]id=([^&]+)/.exec(url || '');
  if (!match) return url;
  return 'https://lh3.googleusercontent.com/d/' + match[1] + '=w1600';
}

function handleListGallery() {
  var rows = readRows('Gallery').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      image: normalizeDriveImageUrl(row.image),
      category: row.category,
      date: dateOnly(row.date),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

// Shared by handleUploadImage (the generic "pick a photo" field used on
// Events/Projects/Programs/Facilities/Team) and handleAddGalleryImage (which
// creates its Gallery row in the same step). Both save into the same Drive
// folder — there's only one "photos uploaded through the portal" folder
// rather than one per content type, to avoid making the user create and
// wire up five more folder IDs for what is, from Drive's point of view, the
// same kind of file.
function uploadImageToDrive(body) {
  var folder = DriveApp.getFolderById(GALLERY_FOLDER_ID);
  var bytes = Utilities.base64Decode(body.base64);
  var blob = Utilities.newBlob(bytes, body.mimeType || 'image/jpeg', body.filename || 'photo.jpg');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  // drive.google.com/uc?export=view is unreliable for hotlinking as an
  // <img src> — Google serves an interstitial/blocked page for it when
  // requested cross-origin. lh3.googleusercontent.com/d/<id> is the format
  // Drive/Photos use for their own thumbnails and embeds reliably.
  return 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1600';
}

function handleUploadImage(body) {
  var imageUrl = uploadImageToDrive(body);
  return jsonResponse({ success: true, url: imageUrl });
}

function handleAddGalleryImage(body) {
  var imageUrl = uploadImageToDrive(body);
  var id = body.id || generateId();
  var image = {
    id: id,
    title: body.title,
    description: body.description || '',
    image: imageUrl,
    category: body.category,
    date: new Date().toISOString().slice(0, 10),
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Gallery', image);
  return jsonResponse({ success: true, image: image });
}

function handleDeleteGalleryImage(body) {
  var ok = deleteRowById('Gallery', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Photo not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function handleListProjects() {
  var rows = readRows('Projects').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      team: row.team || '',
      technologies: row.technologies || '',
      image: row.image || '',
      iconKey: row.iconKey || '',
      featured: toBool(row.featured),
      link: row.link || '',
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddProject(body) {
  var id = body.id || generateId();
  var project = {
    id: id,
    title: body.title,
    description: body.description,
    team: body.team || '',
    technologies: body.technologies || '',
    image: body.image || '',
    iconKey: body.iconKey || '',
    featured: !!body.featured,
    link: body.link || '',
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Projects', project);
  return jsonResponse({ success: true, project: project });
}

function handleUpdateProject(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('Projects', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Project not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteProject(body) {
  var ok = deleteRowById('Projects', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Project not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Event registrations — a student reserving a seat at one event (NOT the
// Applications tab, which is someone applying to join the Centre itself).
// The tab is created on first use, so there's no manual sheet setup.
// ---------------------------------------------------------------------------

var REGISTRATION_HEADERS = ['id', 'eventId', 'eventTitle', 'eventDate', 'name', 'email', 'phone', 'college', 'year', 'registeredAt'];

function ensureRegistrationsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Registrations')) {
    var sheet = ss.insertSheet('Registrations');
    sheet.getRange(1, 1, 1, REGISTRATION_HEADERS.length).setValues([REGISTRATION_HEADERS]);
    // Phone numbers and dates are stored as text so Sheets doesn't strip a
    // leading zero or reinterpret them.
    sheet.getRange('G:G').setNumberFormat('@');
    sheet.getRange('D:D').setNumberFormat('@');
  }
}

function registrationRow(row) {
  return {
    id: row.id,
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    eventDate: dateOnly(row.eventDate),
    name: row.name,
    email: row.email,
    phone: String(row.phone || ''),
    college: row.college || '',
    year: row.year || '',
    registeredAt: isoString(row.registeredAt),
  };
}

// Capacity check, duplicate check and the append all happen under one lock,
// so two students taking the last seat at the same instant can't both get it.
// Registering the same email twice for one event succeeds and returns the
// existing row (alreadyRegistered) instead of failing or adding a second —
// that also makes it safe for the website to retry after a garbled reply.
function handleRegisterForEvent(body) {
  return withLock(function () {
    ensureRegistrationsSheet();
    var email = String(body.email || '').trim().toLowerCase();
    var capacity = Number(body.capacity) || 0;
    var forEvent = readRows('Registrations').filter(function (row) {
      return String(row.eventId) === String(body.eventId);
    });

    var existing = forEvent.filter(function (row) {
      return String(row.email).trim().toLowerCase() === email;
    })[0];
    if (existing) {
      return jsonResponse({
        success: true,
        alreadyRegistered: true,
        registration: registrationRow(existing),
        spotsLeft: capacity ? Math.max(0, capacity - forEvent.length) : null,
      });
    }

    if (capacity && forEvent.length >= capacity) {
      return jsonResponse({ success: false, error: 'This event is full.' });
    }

    var registration = {
      id: generateId(),
      eventId: body.eventId,
      eventTitle: body.eventTitle || '',
      eventDate: body.eventDate || '',
      name: body.name,
      email: String(body.email || '').trim(),
      phone: body.phone || '',
      college: body.college || '',
      year: body.year || '',
      registeredAt: new Date().toISOString(),
    };
    appendRowUnlocked('Registrations', registration);
    keepPhoneAsText(registration.phone);
    return jsonResponse({
      success: true,
      alreadyRegistered: false,
      registration: registration,
      spotsLeft: capacity ? Math.max(0, capacity - forEvent.length - 1) : null,
    });
  });
}

// appendRow types values the way a person typing into the cell would, so
// "0123456789" became the number 123456789 and "+919876543210" lost its "+" —
// even with the column formatted as text. Setting the format on the cell
// first and only then writing the value keeps a phone number exactly as typed.
function keepPhoneAsText(phone) {
  if (!phone) return;
  var sheet = getSheet('Registrations');
  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) {
      return String(h).trim();
    });
  var col = headers.indexOf('phone') + 1;
  if (col === 0) return;
  sheet.getRange(sheet.getLastRow(), col).setNumberFormat('@').setValue(String(phone));
}

function handleListRegistrations() {
  ensureRegistrationsSheet();
  var rows = readRows('Registrations').map(registrationRow);
  return jsonResponse({ success: true, items: rows });
}

// Just {eventId, count} pairs — what the public event pages need for
// "12 spots left" without shipping every student's details to the site.
function handleListRegistrationCounts() {
  ensureRegistrationsSheet();
  var counts = {};
  readRows('Registrations').forEach(function (row) {
    counts[row.eventId] = (counts[row.eventId] || 0) + 1;
  });
  var items = Object.keys(counts).map(function (eventId) {
    return { eventId: eventId, count: counts[eventId] };
  });
  return jsonResponse({ success: true, items: items });
}

function handleDeleteRegistration(body) {
  var ok = deleteRowById('Registrations', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Registration not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Achievements — hackathon wins, prizes and awards shown in the public
// "Hackathons & Achievements" section.
// ---------------------------------------------------------------------------

function handleListAchievements() {
  var rows = readRows('Achievements').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      placement: row.placement,
      institution: row.institution || '',
      description: row.description || '',
      image: normalizeDriveImageUrl(row.image),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddAchievement(body) {
  var id = body.id || generateId();
  var achievement = {
    id: id,
    title: body.title,
    placement: body.placement,
    institution: body.institution || '',
    description: body.description || '',
    image: body.image || '',
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Achievements', achievement);
  return jsonResponse({ success: true, achievement: achievement });
}

function handleUpdateAchievement(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('Achievements', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Achievement not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteAchievement(body) {
  var ok = deleteRowById('Achievements', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Achievement not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Team members — the public "Meet the Team" roster. NOT the same as the
// "Faculty" tab, which stores admin portal login credentials.
// ---------------------------------------------------------------------------

function handleListTeamMembers() {
  var rows = readRows('TeamMembers').map(function (row) {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      bio: row.bio,
      image: row.image || '',
      expertise: row.expertise || '',
      contact: row.contact || '',
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddTeamMember(body) {
  var id = body.id || generateId();
  var member = {
    id: id,
    name: body.name,
    role: body.role,
    bio: body.bio,
    image: body.image || '',
    expertise: body.expertise || '',
    contact: body.contact || '',
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('TeamMembers', member);
  return jsonResponse({ success: true, member: member });
}

function handleUpdateTeamMember(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('TeamMembers', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Team member not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteTeamMember(body) {
  var ok = deleteRowById('TeamMembers', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Team member not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

function handleListPrograms() {
  var rows = readRows('Programs').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      duration: row.duration,
      level: row.level,
      topics: row.topics || '',
      image: row.image,
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddProgram(body) {
  var id = body.id || generateId();
  var program = {
    id: id,
    title: body.title,
    description: body.description,
    duration: body.duration,
    level: body.level,
    topics: body.topics || '',
    image: body.image,
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Programs', program);
  return jsonResponse({ success: true, program: program });
}

function handleUpdateProgram(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('Programs', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Program not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteProgram(body) {
  var ok = deleteRowById('Programs', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Program not found.' });
  return jsonResponse({ success: true });
}

// ---------------------------------------------------------------------------
// Facilities
// ---------------------------------------------------------------------------

function handleListFacilities() {
  var rows = readRows('Facilities').map(function (row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      image: row.image,
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt),
    };
  });
  return jsonResponse({ success: true, items: rows });
}

function handleAddFacility(body) {
  var id = body.id || generateId();
  var facility = {
    id: id,
    title: body.title,
    description: body.description,
    image: body.image,
    createdBy: body.createdBy || '',
    createdAt: new Date().toISOString(),
  };
  appendRow('Facilities', facility);
  return jsonResponse({ success: true, facility: facility });
}

function handleUpdateFacility(body) {
  var updates = {};
  Object.keys(body).forEach(function (key) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key];
  });
  var ok = updateRowById('Facilities', body.id, updates);
  if (!ok) return jsonResponse({ success: false, error: 'Facility not found.' });
  return jsonResponse({ success: true });
}

function handleDeleteFacility(body) {
  var ok = deleteRowById('Facilities', body.id);
  if (!ok) return jsonResponse({ success: false, error: 'Facility not found.' });
  return jsonResponse({ success: true });
}
