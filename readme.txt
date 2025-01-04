go to back end folder and npm start
go to front end folder and npm start

ajhellquist GiDuWXYsi2Gg43wJ cluster0

connection string
mongodb+srv://ajhellquist:GiDuWXYsi2Gg43wJ@cluster0.jsqhw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

select [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/90192]

You are an expert software engineer debugger. Your job is to look at my instructions and my code and try to debug it and make it work EXACTLY as I have defined in my instructions. If there is anything that is ambiguous to you or if you need more guidance ask follow up questions.

I am linking you code to a code editor box that I am making as a part of my webpage. The goal for it is to help auto complete "variables" that I have stored in a database. There are 3 types of variables: metrics, attributes and attribute values. 

When auto completing a variable, it should output rich text of the variable name, but really contain a string of text that is defined in the code. If you have any uncertainty about the how this underlying text should be formatted let me know and I will help you but you should be able to decipher in the code provided. For the output for the autocomplete for metrics the text color should be green, the attributes should be purple and the attribute values should be orange. The auto complete rich text should act as a single character...ie...if the cursor is on the right edge of the text and i hit the left arrow the cursor should move to the very left edge of the first letter of the variable. When I hit backspace on a variable it should delete the whole thing. 

The user will also type in code that is not auto completed as well and that text needs to be black. Anything that is not the result of an autocomplete needs to be black.

There is also a auto complete box that has the suggested auto complete options that appear as the user types words in the code editor. These options should appear alphabetically in order according to what the user has typed. Once the user has typed something that doesnt match a variable name that should disappear from the auto complete box. A user should be able to hit tab to insert the auto complete or click on the variable name in the box to insert. Those should be the only two ways to insert.

Lastly, there are "copy code" and "clear code" buttons. The copy code should copy all text in the text box. When I paste in another browser or text area it should paste whatever I've written plus the variables in the same order as written in the box. The paste should not be the rich text variable name but what I have defined as the underlying format instead.


1. Single-Character “Span” Behavior

You mentioned that the autocomplete rich text should act as if it’s a single character, so that when you hit the left arrow from the right edge of the variable, the cursor jumps before the entire variable instead of into the middle. Right now, the code only explicitly handles backspace so that the entire span is removed in one go. For arrow keys, the default behavior may let the cursor move inside the span. Did you want custom logic to prevent the cursor from navigating inside the span and always jump outside it? If so, I’ll need to add some key handling (or possibly contenteditable="false" on the span) so that you can’t place the cursor in the middle of the variable. Let me know if that’s correct.

Answer: That is correct

2. Typed Text Color

Right now, any user-typed text (which is not inserted as a span) inherits the default color (which is presumably black). Do you want that explicitly set to black with a style, or is the default behavior sufficient?

Answer: If there's not a big risk to creating a bug or hindering performance let's force it black.

3. Alphabetical Suggestions

You mentioned the suggestions should appear alphabetically. Currently, the code filters the suggestions but doesn’t appear to sort them. Do you want me to add a .sort((a, b) => a.name.localeCompare(b.name)) so they appear in alphabetical order?

Answer: Yes they should be alphabetical ie...in order of most likely match to what I am typing. If I have variables called "Variable A", "Variable B", "Variable C", and "Random Variable" and i type "Var" it should show those first three in alphabetical order and not show "Random Variable".

4. Underlying Format

It looks like the underlying format for metrics, attributes, and attribute values is defined in getVariableReference. Let me know if the bracket format is exactly correct or if there’s any subtlety (like spaces or punctuation) that you want changed in that string.

Answer: The format that is already specified is exactly how I want it and I do not want to change that.

Also something that I didn't include in the original prompt that I want you to consider. Variables are very commonly multiple words long, so spaces need to be treated properly. For example I might have "Variable A". If i backspace after the "A" it should get rid of the whole thing, not just the "A". The space between words needs to be considered. Same thing goes with moving the cursor across a variable name.

SELECT [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4904] WHERE [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4042] = [/gdc/md/vyfe74jrhva0hwwcm30y9m8enafaeag9/obj/4042/elements?id=NA]


