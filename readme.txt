go to back end folder and npm start
go to front end folder and npm start

ajhellquist GiDuWXYsi2Gg43wJ cluster0

connection string
mongodb+srv://ajhellquist:GiDuWXYsi2Gg43wJ@cluster0.jsqhw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

This is looking great! There's some additional functionalities that I think would be super helpful for you to add. 

1. Adding multiple variables into the editor by holding down the ALT button and left clicking to select multiple. if multiple are highlighted, then when you hit tab it will insert all of them, each comma separated.

2. It would be really nice to be able to start typing one of the words of a variable and have it show up. Right now if I have a variable called "Project Name" I have to type "pro" to get it to show up. It would be nice if I could also type "Nam" to get it to show up as well. Ask me any clarifying questions you might have on this one if my logic isn't comprehensive here.

3. When I click on a variable that is already in the text editor it should highlight the rich text and let me hit control/command-c to copy it and let me hit control/command-v to paste it anywhere I want in the text editor. I might need to do this if I am adding the same variable many times, it would be nice to have to copied to the keyboard for quick pasting.

Again, ask me questions if you feel like the logic I have given to you on any of these conflicts with prior instructions and we can work it out.

1. Multi-select Autocomplete

You want to hold Alt + Left Click on multiple suggestions in that little autocomplete box. Each time you Alt+Left Click one, it becomes “highlighted” (so presumably we’d visually show it’s selected). Then, when you hit Tab, it should insert all the selected variables, separated by commas, into the editor, right?

Answer: Yes that's right

After insertion, do you want the autocomplete box to close? Or stay open in case you want to select more?

Answer: By close you mean be empty because the cursor in the text box would now be on an empty space then yes that's correct.

Also, if I click a single suggestion without holding Alt, we should assume the user just wants to insert that one, correct?

Answer: Yes that's correct

2. Partial (Substring) Matching

Right now, we do prefix matching by checking if the variable name starts with the typed word. You’d like it to show any variable if the typed text is contained anywhere inside the variable name. For instance, “Project Name” should be suggested if I type Nam (not just Pro).

Answer: Correct

Should we still do the alphabetical sorting on the final filtered list after we do the substring match?

Answer: I think so. Let's try that and if it looks weird I will come back to you.

Also, do we want to ensure that if the user types Nam, then “Name” is shown, “My Name” is shown, “Project Name” is shown, etc.? In other words, truly any substring ignoring spaces?

Answer: correct

Let's hold off on implementing the copy and paste feature mentioning in section 3 for now. I want to get the above correct before we try that.

3. Copy and Paste an Existing Variable in the Editor

When you say “click on a variable that is already in the text editor,” do you literally mean single-click to highlight? Or do you see the user typically doing a “drag select” around that variable? Right now, the <span> with contentEditable="false" is basically unselectable, so we may need special logic to highlight it.

Answer: I would like them to click it once and it highlights the whole thing.

After it’s highlighted, the user should be able to press Ctrl/Command + C to copy it, and Ctrl/Command + V to paste it with the same rich text formatting (meaning it’s still a <span> with the same color and data-reference)?

Also, do we want to allow the user to paste it multiple times? Because typically, once it’s in the clipboard, the user can paste as many times as they want—assuming we handle the paste event so it preserves that <span>.

One edge case: if the user tries to paste outside of the editor, do we want to default to the bracket reference, or do we want the actual text “Project Name”? Right now, our “Copy Code” button (the big one) yields bracket references. But normal clipboard copying might behave differently. Just want to confirm if that’s okay.

SELECT [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4904] WHERE [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4016] = [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4042/elements?id=NA]

[/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4042/elements?id=12345]
