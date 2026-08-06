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
  });
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
      if (String(values[r][idCol]) === String(id)) {
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
      if (String(values[r][idCol]) === String(id)) {
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
  var id = generateId();
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

function handleAddGalleryImage(body) {
  var folder = DriveApp.getFolderById(GALLERY_FOLDER_ID);
  var bytes = Utilities.base64Decode(body.base64);
  var blob = Utilities.newBlob(bytes, body.mimeType || 'image/jpeg', body.filename || 'photo.jpg');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  // drive.google.com/uc?export=view is unreliable for hotlinking as an
  // <img src> — Google serves an interstitial/blocked page for it when
  // requested cross-origin. lh3.googleusercontent.com/d/<id> is the format
  // Drive/Photos use for their own thumbnails and embeds reliably.
  var imageUrl = 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1600';

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
