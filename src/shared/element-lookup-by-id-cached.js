/* $$(id): the page's elements by id, looked up once and remembered */
const _el = {},
  $$ = (id) => _el[id] || (_el[id] = document.getElementById(id));
