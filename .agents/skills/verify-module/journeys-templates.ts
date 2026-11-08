import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, bodyHas, call, delivered, header, pick, same, withSession } from "./session.ts";

const inlineTemplate: Journey = {
  title: "an inline template has every {{ variable }} replaced, nested values written as JSON, and is sent as html or text",
  entryPoint: "`SendTemplate` with inline html and text templates through core",
  async run(context) {
    await withSession(context, async (session) => {
      const html = await call(session, "SendTemplate html", "SendTemplate", [
        { to: "ada@example.com", subject: "Order", template: { type: "html", content: "<p>Hi {{ name }}, {{name}}: {{ order }}</p>" }, variables: { name: "Ada", order: { id: 7 } } },
      ]);
      const text = await call(session, "SendTemplate text", "SendTemplate", [{ to: "ada@example.com", subject: "Plain", template: { type: "text", content: "Hello {{ name }}" }, variables: { name: "Ada" } }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(html.folder, [answered(html), same("the html send succeeded", pick(html.value, "success"), true)]);
      context.expect(text.folder, [answered(text), same("the text send succeeded", pick(text.value, "success"), true)]);
      context.expect(seen.result.folder, [
        same("two messages were delivered", seen.entries.length, 2),
        same("every occurrence is replaced and the nested value is JSON", bodyHas(seen.entries[0], '<p>Hi Ada, Ada: {"id":7}</p>'), true),
        same("the text template is a text body", bodyHas(seen.entries[1], "Hello Ada"), true),
        same("the subjects are the calls'", [header(seen.entries[0], "Subject"), header(seen.entries[1], "Subject")], ["Order", "Plain"]),
      ]);
    });
  },
};

const providerTemplate: Journey = {
  title: "a provider template id is answered NOT_SUPPORTED and nothing is sent",
  entryPoint: "`SendTemplate` with `template: { id }` through core",
  async run(context) {
    await withSession(context, async (session) => {
      const sent = await call(session, "SendTemplate provider", "SendTemplate", [{ to: "ada@example.com", template: { id: "welcome" } }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(sent.folder, [answered(sent), same("the send failed with NOT_SUPPORTED", [pick(sent.value, "success"), pick(sent.value, "error", "code")], [false, "NOT_SUPPORTED"])]);
      context.expect(seen.result.folder, [same("nothing was delivered", seen.entries.length, 0)]);
    });
  },
};

const literalTemplate: Journey = {
  title: "variable names match literally, values are inserted verbatim, and a name that is no valid regular expression is still sent",
  entryPoint: "`SendTemplate` with `$&` in a value, a dotted name and an unbalanced bracket through core",
  async run(context) {
    await withSession(context, async (session) => {
      const literal = await call(session, "SendTemplate literal", "SendTemplate", [
        {
          to: "ada@example.com",
          subject: "Literal",
          template: { type: "text", content: "{{ price }} | {{ aXb }} | {{ a.b }} | {{ first }}" },
          variables: { price: "$& off", "a.b": "dot", first: "{{ second }}", second: "leaked" },
        },
      ]);
      const bracket = await call(session, "SendTemplate bracket", "SendTemplate", [{ to: "ada@example.com", subject: "Bracket", template: { type: "text", content: "{{ (x }}" }, variables: { "(x": "bracket-name-sent" } }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(literal.folder, [answered(literal), same("the literal send succeeded", pick(literal.value, "success"), true)]);
      context.expect(bracket.folder, [answered(bracket), same("the bracket send succeeded", pick(bracket.value, "success"), true)]);
      context.expect(seen.result.folder, [
        same("two messages were delivered", seen.entries.length, 2),
        same("names match literally and values are verbatim", bodyHas(seen.entries[0], "$& off | {{ aXb }} | dot | {{ second }}"), true),
        same("an unbalanced bracket name is replaced", bodyHas(seen.entries[1], "bracket-name-sent"), true),
      ]);
    });
  },
};

export const templateJourneys = { "inline-template": inlineTemplate, "literal-template": literalTemplate, "provider-template": providerTemplate };
