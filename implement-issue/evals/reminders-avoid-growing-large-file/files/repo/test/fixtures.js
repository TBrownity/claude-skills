/** A small library for tests; each call returns a fresh copy. */
function makeLibrary() {
  return {
    members: [
      { id: "m1", name: "Lena Hoffmann", email: "lena@example.org", joinedAt: "2023-02-11", suspended: false },
      { id: "m2", name: "Karim Aydin", email: "karim@example.org", joinedAt: "2024-06-30", suspended: false },
    ],
    books: [
      { id: "b1", title: "Momo", author: "Michael Ende", isbn: "9783522202107", retired: false },
      { id: "b2", title: "Krabat", author: "Otfried Preußler", isbn: "9783522202602", retired: false },
    ],
    loans: [],
    reservations: [],
    payments: [],
  };
}

module.exports = { makeLibrary };
