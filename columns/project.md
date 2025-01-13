
Goals:
- Create a game in html and javascript
- The game is called 'Columns' and its composed of a grid of 20 rows by 10 columns called the 'game board'
- each time a 'piece' of 1 column by 3 rows will fall down the game board
- each half a second, the piece will fall down one row
- once the piece can no longer move down, it will be locked in place and a new piece will start falling down

Piece Details:
- each cell in a piece has a random color
- available colors are: [list the available colors]
- pieces spawn at the top center of the board

Scoring:
- once a piece is locked in place, all the cells in the grid that have the same color will be cleared. Each cell cleared will be worth 1 point
- only vertical and horizontal matches count

Controls:
- the player can move the piece left and right using the approriate arrow keys
- the player can 'rotate' pieces up and down using the approriate arrow keys
    - rotating up means the cells in the piece swap places with the cells above them
        - the topmost cell becomes the bottommost cell
    - rotating down means the cells in the piece swap places with the cells below them
        - the bottommost cell becomes the topmost cell
- space bar is used as a soft drop key to make the piece fall faster

Game Flow:
- every 50 points the game speed increases by 50 milliseconds until the game speed is at 100 milliseconds
- the next piece will be previewed at the top of the game board
- pressing escape will pause the game
- pressing escape again will resume the game
- the game ends when a piece can no longer move down and its top is at the top of the game board




