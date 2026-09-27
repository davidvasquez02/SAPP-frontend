import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/pages/Actas/ActasPage.tsx", "utf8");
const styles = readFileSync("src/pages/Actas/ActasPage.css", "utf8");

test("muestra dentro del modal el error recibido al eliminar un acta", () => {
  assert.match(page, /const \[deleteError, setDeleteError\] = useState<string \| null>\(null\)/);
  assert.match(page, /catch \(requestError\)[\s\S]*setDeleteError\(requestError instanceof Error \? requestError\.message/);
  assert.match(page, /actas-delete-modal__error" role="alert">\{deleteError\}/);
  assert.doesNotMatch(page, /catch \(deleteError\)[\s\S]*setError\(deleteError/);
});

test("el aviso de eliminación usa tokens semánticos del tema", () => {
  const errorRule = styles.match(/\.actas-delete-modal__error\s*\{[^}]+\}/)?.[0] ?? "";
  assert.match(errorRule, /var\(--danger\)/);
  assert.match(errorRule, /color-mix/);
  assert.match(errorRule, /overflow-wrap:\s*anywhere/);
});
