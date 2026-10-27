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

The discussion will run for many turns, and everything you read now stays in this conversation for all of them. So if you can start a sub-agent (in Claude Code: the `Agent` tool, e.g. with the `Explore` type), let it do the analysis. Give it the requirements and the steps above, and ask it to return only:

- the code locations the change touches, as `file:line`, with one line each on what is there,
- the candidate decisions, each with a draft question and what the code says about it.

Treat its findings as leads. Later, when you write the card for a decision, read the few code locations that decision rests on yourself, not whole directories.

Then talk to the human until you agree on every single decision.

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
- 🤖 You decided this on your own, because the human asked for fewer questions (see "Level of detail"). The Outcome column shows the chosen option's code and slug.
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
| 🤖 | **5** | **save-notice** | What does the notice after saving say? | *5A (saved)* |

Keep the question in the table short (about 10 words at most). The full question goes into the decision card (see "Presenting a decision").

Print the initial decision table as soon as you start the discussion. Then ask about the level of detail (see "Level of detail") before you present the first decision.

A full table on every turn costs a lot of output and fills the conversation with copies. Print the whole table only:

- in the first message,
- when decisions are added, split or dropped,
- after every fourth or fifth settled decision, since the last full table,
- when the human asks for it,
- at the end (see "Finishing up").

In every other message, start with one status line of what changed and how far you are, e.g. `✅ **2 (xss-protection)** → *2A (sanitize)* · 🤖 **5 (save-notice)** → *5A (saved)* · 💬 **3 (preview)** · 6/12 settled`.

Always print the table or status line *first*, then a short recap of what changed, then the decision card *last*. Assume any text you print *before* a table scrolls out of view and will easily be overlooked by the human.
The first message is the exception, because its question about the level of detail refers to the decisions in the table. It must contain the whole table: print what you found first, kept to a few lines, then the table, then the question. Put nothing between the table and the question, so the table is still in view when the human answers. Never ask this question in a message without the table.

### Level of detail

How many decisions a human wants to discuss differs from person to person and from task to task. Right after the initial table, ask how many of them the human wants to discuss. This question is not a decision in the table, so it gets no number and no option codes.

- **Fewer questions**: Decide the small decisions on your own instead of asking. A decision is small when your recommendation is strong (see "Recommendation") and a wrong choice would be cheap to fix later. Keep discussing everything else: decisions with a real trade-off, decisions that depend on something only the human knows (product direction, team preferences, deadlines), and decisions that are hard to undo, such as database schema changes or public behaviour.
- **More questions**: Also bring up details you would otherwise settle on your own in the plan, such as names, error messages or edge cases. Add them to the table with the next free numbers, or as sub-decisions (`2.1`, `2.2`) of the decision they belong to.

The human can only choose well if each answer says concretely what it means for this requirement. A bare "fewer questions" or a list of decision numbers tells them nothing, because the dialog hides the table, and nobody remembers what **7** was. So before you ask, work out:

- which decisions you would make on your own with fewer questions, and the answer you would pick for each,
- which details you would add with more questions, each phrased as a short concrete question.

Then offer these answers, in this order:

- **All decisions**: discuss every decision in the table.
- **Fewer**: name each decision you would make on your own, with its number, its slug and the answer you would pick.
- **More**: name each question you would add.

If a list would grow beyond about 15 lines, name categories instead, with their count and two or three examples, e.g. `6 wording details (notices, labels, e.g. the save notice)`. Leave out an answer that would change nothing, e.g. "Fewer" when no decision is small. If only "All decisions" remains, skip the question and say in one line that you will discuss every decision.

Use the answer dialog if you have one. The dialog does not show the table, so it never replaces it: print the table in the chat first, in the same message, as "Printing the decision table" describes. The dialog itself must be answerable without the table:

- `header`: `Detail`.
- `question`: the number of decisions, then the question, e.g. `I found 12 decisions. How many of them do you want to discuss?`
- `options`: the answers in the order above. The `label` names the answer and how many decisions you would discuss with it, e.g. `All 12 decisions`, `Fewer: 8 decisions`, `More: 16 decisions`. The `description` says in one sentence what changes, by category. The `preview` holds the list: for "All decisions", every decision in the table with its number, slug and short question; for "Fewer" and "More", the lists described above.

For a table with 12 decisions, the dialog could be:

```json
{
  "questions": [{
    "header": "Detail",
    "question": "I found 12 decisions. How many of them do you want to discuss?",
    "multiSelect": false,
    "options": [
      {
        "label": "All 12 decisions",
        "description": "I ask about every decision in the table.",
        "preview": " 1 opt-in-flag      Where do we store the opt-in?\n 2 xss-protection   May welcome messages contain HTML?\n 3 preview          Show a preview before sending?\n 4 migration        What happens to existing messages?\n 5 save-notice      What does the notice after saving say?\n 6 admin-access     Which admins may edit messages?\n 7 button-label     What does the send button say?\n 8 sort-order       How is the message list sorted?\n 9 delivery         Send right away or in a background job?\n10 unsubscribe      Can users opt out again, and where?\n11 empty-state      What shows when there are no messages?\n12 audit-log        Do we log who changed a message?"
      },
      {
        "label": "Fewer: 8 decisions",
        "description": "I decide 4 wording and display details on my own: the save notice, the button label, the sort order and the empty state.",
        "preview": "I decide on my own:\n\n 5 save-notice    \"Welcome message saved.\"\n 7 button-label   \"Send welcome message\"\n 8 sort-order     newest first, like other admin lists\n11 empty-state    short hint with a \"New message\" link\n\nWe discuss the other 8."
      },
      {
        "label": "More: 16 decisions",
        "description": "I also ask about 4 details I would otherwise settle in the plan: a name, an error message and two edge cases.",
        "preview": "I also ask:\n\n- What do we call the new column on users?\n- Which error does the admin see when sending fails?\n- What happens for users without an email address?\n- Do we resend when an admin edits a sent message?"
      }
    ]
  }]
}
```

Without a dialog, ask the question after the table, with the same three answers as a list, each followed by its list of decisions or questions.

Mark each decision you make on your own with 🤖 in the table, with the chosen option in the Outcome column. Make it as soon as the decisions it depends on are settled. Do not present a decision card for it, but name it in your status line and recap. The human can reopen any 🤖 decision by naming it; it then gets a decision card like any other.

Decisions that come up later in the discussion follow the same level. The human can change the level at any time. When they ask for fewer questions, decide the open small decisions on your own. When they ask for more, bring up the details you would have settled on your own.

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

Use a card every time you ask for a decision: for a decision you are bringing up for the first time, and for a decision you return to after a digression.

### Answer dialog

If you have a tool that lets the human answer by picking from a list of options (in Claude Code: `AskUserQuestion`), use it for the card, so the human can answer with a click. The card then has two parts:

- **In the chat**: heading, context and recommendation line, in this order. Leave out the question line, the options and the closing line, because the dialog shows them.
- **In the dialog**, opened right after the chat part as the last thing in your message:
  - `header`: `#` and the decision number, e.g. `#2` or `#2.1`.
  - `question`: the decision number and slug, then the full decision question, e.g. `2 (xss-protection): Should admins be able to use HTML in WelcomeMessage#body, and if so, how do we keep it safe to render?`
  - `options`: the real options in letter order, at most four (`A` to `D`). The `label` is the option code and slug, e.g. `2A sanitize`. Add the strength of your recommendation to the label of the option you recommend: ` (Strongly recommended)`, ` (Recommended)` or ` (Weakly recommended)` (see "Recommendation"). With no recommendation, no label gets a suffix. The `description` gives the option's trade-offs in one or two sentences.
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
      {"label": "2A sanitize (Strongly recommended)", "description": "Allow b, i and a, strip everything else. Keeps existing messages intact, but needs tests for the allow-list."},
      {"label": "2B escape-everything", "description": "Treat the body as plain text. Smallest change, but existing messages show their <b> tags literally."}
    ]
  }]
}
```

Each dialog question covers exactly one decision. A dialog usually has one question, or up to four for a batch of small decisions (see "Order of discussion"). An option ruled out earlier stays out of the dialog, and the other options keep their letters.

While the dialog is open, the human may not see your chat text. Write the dialog so it can be answered on its own: wherever it mentions another decision, give its number, its slug and what it is about, never a bare number.

Use the plain-text card instead of the dialog when:

- you have no such tool,
- more than four options are still open,
- the human has said they prefer to answer in text. Keep the text card for the rest of the session then.

Read the answer like this:

- The human picks an option without a note: that is explicit agreement. Lock the decision.
- The human picks an option and adds a note that clearly refines it, e.g. "but also allow `u`": lock the decision as `2A+` with that refinement right away, without asking again, and name the refinement in your status line. The human can reopen it.
- The human picks an option and adds a note that is a question, a doubt, or changes the option substantially: continue as in "Explicit agreement".
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

- **Strong**: `A` is better in most of the dimensions that matter for this project, and the other options only win in narrow cases. Say so plainly, e.g. "Clearly *2A (sanitize)*." In a dialog: `(Strongly recommended)`.
- **Normal**: there is a real trade-off, and `A` wins on balance for this project. The other options would only be better under conditions you consider unlikely here; name them. In a dialog: `(Recommended)`.
- **Weak**: the options are close, and `A` wins by a small margin. Say so, e.g. "Slightly *2A (sanitize)*", and name what would tip it towards `B`, especially if it is something only the human knows. In a dialog: `(Weakly recommended)`.
- **None**: the options are genuinely balanced, or the choice depends entirely on something only the human knows (product direction, team preferences, deadlines). Say that you have no preference and what the choice depends on. In this case, list the option with the fewest changes as `A`.

Do not soften a strong recommendation into "I lean slightly towards ..." out of politeness. A hedge that does not match your assessment hides information the human needs to decide well. A clear recommendation is not pressure as long as the other options are described fairly, with their real advantages, and the human knows they can pick any of them or something else. Make sure `B` is a real alternative described on its merits, not a straw man that makes `A` look good.

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
- On a card for a newly presented decision, is `A` the option you recommend? In a dialog, does only the recommended option carry a suffix, and does the suffix match the strength in the recommendation line?
- Does the `**Recommendation:**` line state the strength you actually believe (strong, normal, weak or none), without hedging a strong recommendation?
- Does the dialog make sense without the chat text, with no bare decision numbers?
- Does every option code in your recommendation, recap and table match the option list, and the letters this decision had earlier in the session?
- Does the message ask about one decision, or about a batch of at most four small, independent decisions in one dialog?

## Explicit agreement

Only lock a decision when the human agrees explicitly. Picking an option counts, also with a note that clearly refines it (see "Answer dialog"), and so does naming a code with such a refinement in chat, e.g. "2A, but also allow `u`". The only decisions you lock without the human are the small ones they left to you by asking for fewer questions (see "Level of detail").
When you make a counter-proposal to the human's input, or answer the human's question, end your message by asking again whether you are in agreement. Ask it as a concrete yes/no question that names the decision and option code, e.g. "Shall we lock **2 (xss-protection)** as *2A+ (sanitize)*, with `u` added to the allow-list?"
When you use the answer dialog, ask this as a dialog too, with options like `Lock 2A+` and `Keep discussing`.
This confirmation question is enough while you are converging on one option. If the discussion reopens the choice between several options, show the decision card again, with the same letters.
Be patient, help the human understand consequences and trade-offs, and allow a full discussion. Never push the human into making an uninformed decision, even when the discussion drags on.

## Order of discussion

Every message costs a turn, so small decisions can share one. Discuss a decision on its own, with one card or one dialog question, when it has a real trade-off (a normal, weak or no recommendation), is hard to undo, or other decisions depend on it.

Ask about up to four other decisions together, in one dialog, when each of them:

- has a strong recommendation,
- needs at most two sentences of context,
- is independent of the others in the batch, so no answer changes the options of another.

In the chat, give each decision of the batch its heading, context and recommendation line, in the order of the dialog questions. The dialog then has one question per decision, each as "Answer dialog" describes. Read each answer on its own: lock the decisions the human picked, and discuss the ones they wrote their own answer for, one at a time.

Batch only in a dialog, which shows one question at a time. Without a dialog, several text cards in one message blur together, so ask about one decision per message.

If a single answer would resolve several items, make them one decision. If there are many small decisions, the human can ask for fewer questions (see "Level of detail").

Start with the decisions that appear key to the requirements, e.g. when many other decisions depend on it or follow from it.

## Free discussion, quick answers

Keep this a free-form discussion. The answer dialog and the shorthand codes (or option slugs) are a convenience for quick replies, not a wizard: the human should always feel free to think out loud, push back, or propose something you didn't list.
Explain to the human that they can freely choose any other approach, by writing their own answer in the dialog or by typing prose into chat.
Open a dialog only when a decision is ready to be made. While the human is still asking questions or weighing trade-offs, answer in prose, and open the dialog once the discussion converges.

## Finishing up

When everything is agreed and no open question or edge case remains:
- Print the final table
- If you made decisions on your own (🤖), name them once more, so the human can reopen any of them before the plan is written
- Write a detailed execution plan where the project keeps plans (e.g. `doc/plans`, or `plans/`; if there is no such place, use `plans/`). The plan must stand on its own, because the implementation runs without this conversation: every decision with its outcome and the reason for it, the code locations to change, the order of the steps, and everything you learned about the code that the implementation needs. Write each step so that an agent who reads only the plan and this step can carry it out: what to change and where, which decisions apply, and how to tell that it is done (usually a test to run). `/implement-plan` hands every step to a separate, cheaper sub-agent, so a step that leans on knowledge from this conversation or from another step will fail there.
- Suggest implementing the plan in a fresh session: `/clear`, then `/implement-plan <path to the plan>`. Say in one line why: in this session, the whole discussion would be carried through every step of the implementation and cost usage each time. If the human wants to implement in this session anyway, use the `/implement-plan` skill. It needs no strong model, since sub-agents on Sonnet write the code: if this session runs on Opus, mention that the human can switch the fresh session to Sonnet with `/model` to save more.

To find out whether `/implement-plan` is installed, start from the list of skills your harness shows you. Only if it is not in that list, look in the harness's standard skill locations, since some harnesses announce only some of the installed skills. If it is missing, say so in one line and suggest a fresh session with "Implement `<path to the plan>`" instead. Never install anything yourself.

## Begin your work

Now start analyzing the code base and then discuss every open question.
