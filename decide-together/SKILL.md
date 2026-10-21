---
name: decide-together
description: >-
  Resolves every detailed decision needed to implement a chosen approach to a software
  requirement, producing a plan an agent can execute without further questions. Walks through
  the future implementation, surfaces every decision, edge case and blocker, and settles each
  one with the user before any code is written. The input is a requirement whose approach is
  already settled. The output is a detailed implementation plan with no open questions. Use
  when the user says "let's plan this", "grill me on the requirements", "let's agree on
  everything", or wants to hash out, pin down, de-risk or stress-test a design.
---

# Decide together

The human wants to plan a major change that may affect many parts of the codebase.
Analyze the code base to discover any question, blocker or decision required to later implement the requirements autonomously without further human input.

To discover the required decisions, walk through the future implementation in your mind and imagine the required steps, such as:

- Changing models and classes that encapsulate business logic and guarantee data integrity
- Changing routes and controllers (that find and call the model)
- Changing the database schema
- Changing frontend screens (often involving view templates that render HTML, or JSON API endpoints)
- Reusing or changing the frontend component library (e.g. buttons, cards)
- Resolving tensions with existing functionality that would be affected by this change

Then talk to the human until you agree on every single decision.

## Dependency check

This skill uses other skills from triskweline/skills. Your harness may announce only some
of the installed skills to you, so check which of them are installed by looking in its
standard skill locations. A skill you do not find there is missing.

| Skill | Role in this skill |
| --- | --- |
| `/build-alone` | Runs the autonomous implementation if the human asks for one at the end. |

If all are available, say nothing about it and go on. For each missing skill, say in one
line that it is missing and what you use instead: another skill you have that fills the
role, or that you do the step yourself. Then continue. Where this skill's instructions name
a missing skill, use your substitute for the rest of this run. Do not ask whether to install
or what to substitute, and never install anything yourself.

## Tracking decisions

Track a table of all decisions, which you update and extend as the discussion progresses.

### Decision numbers and slugs

The human will have trouble keeping decisions apart. We can help by clearly identifying each decision:

- Give each decision a unique number (`1`, `2`, `3`).\
  Sometimes decisions will split into sub-decisions during your discussion, number those like `2.1`, `2.2`, `2.3`.
- Also give each decision a slug (1-3 words, like `xss-protection`) that reminds the human what this decision is about. Be brief.

Always include decision numbers and slugs when referring to a decision.\
You can omit the slug if the number is immediately followed by a long-form description, e.g. `Decision 23: XSS protection in welcome messages`.

When you print a decision number or slug, use **bold** formatting, e.g. `**23 (xss-protection)**`.

### Decision questions

Every decision is a question the human has to answer. Formulate that question as soon as you add the decision to the table, not only when you get around to discussing it. If you cannot phrase a decision as a concrete question, you have not understood it well enough yet: look at the code again before you bring it to the human.

A good decision question:

- is a single sentence ending in a question mark,
- names the concrete thing in this codebase it is about (the model, attribute, route, screen or component) instead of a general topic,
- is answered by picking one of the options you offer, so that every option reads as a possible answer to it.

E.g. not "XSS protection?" or "How do we handle security?", but "Should admins be able to use HTML in `WelcomeMessage#body`, and if so, how do we keep it safe to render?"

### Decision states

Track the resolution state of each decision with these emojis. Keep them for the whole session, so the human learns to read the table at a glance:

- ⬜ The decision still needs to be discussed.
- 💬 The decision is currently being discussed with the human.
- ✅ The decision has been agreed upon and is settled. The Outcome column shows the chosen option's code and slug.
- ⏸️ The discussion depends on another decision and is waiting. The Outcome column names that decision.
- ➖ The decision is no longer relevant (e.g. the human has withdrawn a requirement, or a previous decision made the problem go away).

### Printing the decision table

Use these columns:

| | # | Decision | Question | Outcome |
| --- | --- | --- | --- | --- |
| ✅ | **1** | **opt-in-flag** | Where do we store the opt-in? | *1A (users-column)* |
| 💬 | **2** | **xss-protection** | May welcome messages contain HTML? | |
| ⏸️ | **3** | **preview** | Show a preview before sending? | waits on **2** |
| ⬜ | **4** | **migration** | What happens to existing messages? | |

Keep the question in the table short (about 10 words at most). The full question goes into the decision card (see "Presenting a decision").

Print the initial decision table as soon as you start the discussion. Then ask about the level of detail (see "Level of detail") before you present the first decision.
Re-print the whole decision table whenever there's a change.
Always print the table *first*, then a short recap of what changed, then the decision card *last*. Assume any text you print *before* a table scrolls out of view and will easily be overlooked by the human.

### Level of detail

How many decisions a human wants to discuss differs from person to person and from task to task. Right after the initial table, ask whether it has the right level of detail. Give the number of decisions, and say concretely what a coarser and a finer table would look like for this requirement, e.g. "Coarser: 7 instead of 12 decisions. I would merge **3** and **4**, and bundle **8** to **12** for you to confirm in one go."
Offer three answers: keep the table, make it coarser, or make it finer. Use the answer dialog if you have one, with the header `Detail`. This question is not a decision in the table, so it gets no number and no option codes.

- **Coarser**: Merge closely related decisions into one. Bundle the decisions that have a clear recommendation and little impact on the implementation. Present the bundle once, after the key decisions are settled, as a list with your recommended option for each. The human can accept all of them with one answer, or name the ones they want to discuss. Accepting the bundle is explicit agreement to each decision in it.
- **Finer**: Split decisions that combine several choices into sub-decisions (`2.1`, `2.2`). Add decisions for details you would otherwise settle on your own in the plan, such as names, error messages or edge cases.

After a coarser or finer answer, number the decisions again from `1` and print the new table. Nothing has been discussed yet, so the new numbers confuse no one.

The human can ask for a coarser or finer table later too. Then keep the numbers: mark merged decisions ➖ with "merged into **3**" in the Outcome column, and split decisions into sub-decisions.

### Avoid confusing decision codes with lists

When writing ordered lists into the chat, and you're not talking about decision numbers, avoid using integer-numbered bullets. The human will confuse your list items with the numbers from the decision table.
For enumerations in prose text, prefer lower-cased letters (`a.`, `b.`, `c.`) or unordered lists instead.

## Presenting a decision

Whenever you ask the human for a decision, present it as a decision card with the structure below, and put it at the very end of your message. Ending on the card means the question is the last thing the human reads, right above the place where they type their answer. If you can let the human answer through a dialog, do so (see "Answer dialog").

```markdown
**2 (xss-protection)**

Admins can edit welcome messages in `Admin::WelcomeMessagesController`, and
`welcome_messages/show.html.erb` renders `body` with `raw`. Some existing messages
already contain `<b>` tags. Decision **3 (preview)** depends on this one.

**Question:** Should admins be able to use HTML in `WelcomeMessage#body`, and if so,
how do we keep it safe to render?

- *2A (sanitize)*: Allow a short list of tags (`b`, `i`, `a`) and strip everything
  else. More work and needs tests for the allow-list, but keeps existing messages
  intact.
- *2B (escape-everything)*: Treat the body as plain text and escape all of it.
  Smallest change, but existing messages will show their `<b>` tags literally.
- *2X (something-else)*: Describe any other approach in your own words.

**Recommendation:** Clearly *2A (sanitize)*. Breaking existing messages is a real
cost, and the allow-list is a few lines plus tests.

Answer with a code like `2A`, or just think out loud and we'll discuss.
```

The parts, in this order:

- **Heading**: the decision number and slug in bold.
- **Context**: 1-4 sentences on what you found in the code, why it needs deciding, and which other decisions depend on it. Context explains the question, it never replaces it.
- **Question line**: starts with `**Question:**`, followed by the full decision question (see "Decision questions"). Every card has exactly one question line, even when the question seems obvious from the context, because the human may have lost the thread since the last message.
- **Options**: see "Recommend options" and "Option codes".
- **Recommendation line**: starts with `**Recommendation:**`, names option `A`, states how strong your recommendation is, and gives the main reason in one or two sentences (see "Recommend options").
- **Closing line**: one short line inviting a code or a free-form answer.

Use a card every time you ask for a decision: for a decision you are bringing up for the first time, for a decision you return to after a digression, and for each item when you batch small items (one card per item, in order of their decision numbers).

### Answer dialog

If you have a tool that lets the human answer by picking from a list of options (in Claude Code: `AskUserQuestion`), use it for the card, so the human can answer with a click. The card then has two parts:

- **In the chat**: heading, context and recommendation line, in this order. Leave out the question line, the options and the closing line, because the dialog shows them.
- **In the dialog**, opened right after the chat part as the last thing in your message:
  - `header`: `#` and the decision number, e.g. `#2` or `#2.1`.
  - `question`: the decision number and slug, then the full decision question, e.g. `2 (xss-protection): Should admins be able to use HTML in WelcomeMessage#body, and if so, how do we keep it safe to render?`
  - `options`: the real options in letter order, at most four (`A` to `D`). The `label` is the option code and slug, e.g. `2A sanitize`. Add ` (Recommended)` to the label of `A`, unless your recommendation is "none". The `description` gives the option's trade-offs in one or two sentences.
  - No option for `X`: the dialog's built-in free-text answer takes its place.
  - Single-select only. When the options are easiest to compare as code (a schema, a method signature), you can add a short snippet as each option's `preview`.

For the example card above, the dialog is:

```json
{
  "questions": [{
    "header": "#2",
    "question": "2 (xss-protection): Should admins be able to use HTML in WelcomeMessage#body, and if so, how do we keep it safe to render?",
    "multiSelect": false,
    "options": [
      {"label": "2A sanitize (Recommended)", "description": "Allow b, i and a, strip everything else. Keeps existing messages intact, but needs tests for the allow-list."},
      {"label": "2B escape-everything", "description": "Treat the body as plain text. Smallest change, but existing messages show their <b> tags literally."}
    ]
  }]
}
```

When you batch small items, put one question per decision into a single dialog, in order of their decision numbers, at most four. An option ruled out earlier stays out of the dialog, and the other options keep their letters.

Use the plain-text card instead of the dialog when:

- you have no such tool,
- more than four options are still open,
- the human has said they prefer to answer in text. Keep the text card for the rest of the session then.

Read the answer like this:

- The human picks an option without a note: that is explicit agreement. Lock the decision.
- The human picks an option and adds a note: treat the note as a refinement (e.g. `2A+`) or a question, and continue as in "Explicit agreement".
- The human writes their own answer: discuss it. If it is a different approach, it becomes `X` with a new slug.
- The human dismisses the dialog or replies in chat: continue the discussion in prose.

## Recommend options

When you ask the human for a decision, offer at least two real options, `A` and `B`.
E.g. one approach that requires the least changes to existing code, and another that is more work, but also more correct, clean, flexible, performant, or canonical.
When a decision involves major trade-offs, or has major consequences for the later implementation, you can offer up to four real options (`A` to `D`).
Always add one additional option "Something else" with the letter `X`, where the human can propose any approach of their own in prose. `X` never counts toward the real options.

If you can only think of one sensible approach, still offer a `B`: the most plausible alternative, which is often keeping the current behaviour or leaving the topic out of scope. This shows the human what they are deciding against. A card with only `A` and `X` is a confirmation in disguise, and the human cannot weigh it.

### Recommendation

The option you recommend is always `A`. Decide which one you recommend before you write the options, so the human can rely on `A` being your pick without reading the recommendation line first.

State the recommendation with the strength it actually has. Pick the one that matches your assessment:

- **Clear**: `A` is better in most of the dimensions that matter for this project, and the other options only win in narrow cases. Say so plainly, e.g. "Clearly *2A (sanitize)*."
- **Slight**: there is a real trade-off, and `A` wins on balance. Say so, and name what would tip it towards `B`.
- **None**: the options are genuinely balanced, or the choice depends on something only the human knows (product direction, team preferences, deadlines). Say that you have no preference and what the choice depends on. In this case, list the option with the fewest changes as `A`.

Do not soften a clear recommendation into "I lean slightly towards ..." out of politeness. A hedge that does not match your assessment hides information the human needs to decide well. A clear recommendation is not pressure as long as the other options are described fairly, with their real advantages, and the human knows they can pick any of them or something else. Make sure `B` is a real alternative described on its merits, not a straw man that makes `A` look good.

## Option codes

The human will have trouble keeping options apart. We can help by clearly identifying each option:

- Give each option a shorthand code for quick human choices, e.g. `3A` and `3B` for two options for decision `3`. For sub-decisions, the letter follows the full number, e.g. `2.1A`, `2.1B`, `2.1X`.
- Also give each option a slug (1-2 words, like `allow-html`) that distinguishes it from other options for the same decision.\
  The option slug only serves to contrast options, and does not need to also re-identify the decision.
  E.g. when the decision slug is `xss-protection`, the option slug could just be `sanitize` or `escape-everything`.
- The "Something else" option always gets the letter `X`, e.g. `3X (something-else)`.

The human answers with these codes, so a shuffled or missing letter makes their answer ambiguous. Assign letters by these rules:

- **Recommendation first, then in listing order, without gaps.** Your recommended option is `A` (see "Recommendation"). The other options follow in the order you list them: `B`, `C`, `D`, followed by `X`. If there is a `C`, there are also an `A` and a `B`.
- **Codes are permanent.** Once you have shown an option code to the human, it belongs to that option for the rest of the session. When you return to a decision, show the same options with the same letters. If an option is ruled out during the discussion, keep its letter, strike it through with a one-line reason (e.g. `~~*2B (escape-everything)*~~ ruled out: breaks existing messages`), and do not re-letter the others. A new option that comes up in the discussion gets the next unused letter.
- **A changed recommendation keeps the letters.** "`A` is the recommendation" applies when you first present a decision. If the discussion changes your recommendation, do not re-letter the options, because the human may already be thinking in the old codes. Instead, update the recommendation line and say explicitly that it moved, e.g. "**Recommendation:** Now clearly *2C (markdown)*, since you mentioned admins already write Markdown elsewhere."

Always include option codes and slugs when referring to an option.\
You can omit the slug if the shorthand code is immediately followed by a long-form description, e.g. `Option 3A: Sanitize HTML using a strict allow-list of tags and attributes`.

When you print an option code or slug, use *italic* formatting, e.g. `*3B (escape-everything)*`.

When the human accepts an option with minor refinements or amendments, suffix a `+` to the option code, e.g. `3B+`.\
When the human makes a decision that is fundamentally different from the options you recommended, they are effectively choosing option `X`. Keep the `X` code and replace the `something-else` slug with one describing their choice, e.g. `3X (trust-csp)`.

### Check before sending

Before you send a message that contains a decision card, check:

- Does every card have exactly one question, as the `**Question:**` line or as the dialog question, and is it a concrete question about this codebase?
- Are the letters of every card contiguous (`A`, `B`, ...), in alphabetical order, and followed by `X` (in a dialog: by its free-text answer)?
- On a card for a newly presented decision, is `A` the option you recommend? In a dialog, does only `A` carry `(Recommended)`, and only if you have a recommendation?
- Does the `**Recommendation:**` line state the strength you actually believe (clear, slight or none), without hedging a clear recommendation?
- Does every option code in your recommendation, recap and table match the option list, and the letters this decision had earlier in the session?

## Explicit agreement

Only lock a decision when the human agrees explicitly.
When you make a counter-proposal to the human's input, or answer the human's question, end your message by asking again whether you are in agreement. Ask it as a concrete yes/no question that names the decision and option code, e.g. "Shall we lock **2 (xss-protection)** as *2A+ (sanitize)*, with `u` added to the allow-list?"
When you use the answer dialog, ask this as a dialog too, with options like `Lock 2A+` and `Keep discussing`.
This confirmation question is enough while you are converging on one option. If the discussion reopens the choice between several options, show the decision card again, with the same letters.
Be patient, help the human understand consequences and trade-offs, and allow a full discussion. Never push the human into making an uninformed decision, even when the discussion drags on.

## Order of discussion

Discuss each decision item separately.
Avoid batching questions. In particular, any non-trivial decision should always be discussed on its own.
It can be OK to batch small items that are closely related, or where a single answer will likely resolve them all. Each batched item still gets its own decision card.

Start with the decisions that appear key to the requirements, e.g. when many other decisions depend on it or follow from it.

## Free discussion, quick answers

Keep this a free-form discussion. The answer dialog and the shorthand codes (or option slugs) are a convenience for quick replies, not a wizard: the human should always feel free to think out loud, push back, or propose something you didn't list.
Explain to the human that they can freely choose any other approach, by writing their own answer in the dialog or by typing prose into chat.
Open a dialog only when a decision is ready to be made. While the human is still asking questions or weighing trade-offs, answer in prose, and open the dialog once the discussion converges.

## Finishing up

When everything is agreed and no open question or edge case remains:
- Print the final table
- Ask whether to write a detailed execution plan.
  If yes, put it where the project keeps plans (e.g. `doc/plans`, or `plans/`)
- Ask whether the human wants you to fully and autonomously implement the requirements, now that you are in full alignment.
  If yes, use the `/build-alone` skill.

## Begin your work

Now start analyzing the code base and then discuss every open question.
