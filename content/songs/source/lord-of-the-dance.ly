\version "2.26.0"
\header { title = "Lord of the Dance · Simple Gifts" subtitle = "Beginner piano arrangement · C major" composer = "Joseph Brackett · traditional tune" tagline = ##f }
#(set-global-staff-size 18)
\paper { top-margin = 10\mm bottom-margin = 10\mm ragged-last-bottom = ##t }
\score {
\new PianoStaff <<
\new Staff = "up" {
\clef treble \key c \major \numericTimeSignature \time 4/4 \tempo 4 = 60 \partial 4
g8-1 g8-1 | % 0
c'4-1 c'8-1 d'8-2 e'8-3 c'8-1 e'8-3 f'8-4 | % 1
g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1 | % 2
d'4-2 d'4-2 d'4-2 c'4-1 | % 3
d'8-3 e'8-4 d'8-3 b8-2 g4-1 g4-1 | \break % 4
c'8-3 b8-2 c'8-3 d'8-4 e'8-5 d'8-4 e'8-3 f'8-4 | % 5
g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1 | % 6
d'4-2 d'4-2 e'4-3 e'8-3 d'8-2 | % 7
c'4-1 c'8-1 c'8-1 c'2-1 | \break % 8
g'2-5 e'4.-3 d'8-2 | % 9
e'8-3 f'8-4 e'8-3 d'8-2 c'4.-1 d'8-2 | % 10
e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3 | % 11
d'4-3 d'8-3 e'8-4 d'4-3 g4-1 | \break % 12
c'2-1 c'4.-1 d'8-2 | % 13
e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3 | % 14
d'4-2 d'4-2 e'4-3 e'8-3 d'8-2 | % 15
c'4-1 c'4-1 c'4-1 \break % 16
\bar "|."
}
\new Staff = "down" {
\clef bass \key c \major \numericTimeSignature \time 4/4 \tempo 4 = 60 \partial 4
r4 | % 0
c1-5 | % 1
c1-5 | % 2
g,1-5 | % 3
g,1-5 | \break % 4
c1-5 | % 5
c1-5 | % 6
g,1-5 | % 7
c1-5 | \break % 8
c1-5 | % 9
c1-5 | % 10
c1-5 | % 11
g,1-5 | \break % 12
c1-5 | % 13
c1-5 | % 14
g,1-5 | % 15
c2.-5 \break % 16
\bar "|."
}
>>
\layout { }
\midi { }
}
