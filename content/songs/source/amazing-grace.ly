\version "2.26.0"
\header { title = "Amazing Grace" subtitle = "Beginner piano arrangement · C major" composer = "Traditional · NEW BRITAIN" tagline = ##f }
#(set-global-staff-size 18)
\paper { top-margin = 10\mm bottom-margin = 10\mm ragged-last-bottom = ##t }
\score {
\new PianoStaff <<
\new Staff = "up" {
\clef treble \key c \major \numericTimeSignature \time 3/4 \tempo 4 = 60 \partial 4
g4-1 | % 0
c'2-2 e'8-4 c'8-2 | % 1
e'2-4 d'4-3 | % 2
c'2-3 a4-2 | % 3
g2-1 g4-1 | \break % 4
c'2-2 e'8-4 c'8-2 | % 5
e'2-4 d'4-3 | % 6
g'2.-5~ | % 7
g'2-5 e'4-3 | \break % 8
g'2-5 e'8-3 c'8-1 | % 9
e'2-3 d'4-2 | % 10
c'2-3 a4-2 | % 11
g2-1 g4-1 | \break % 12
c'2-2 e'8-4 c'8-2 | % 13
e'2-4 d'4-3 | % 14
c'2.-2~ | % 15
c'2-2 \break % 16
\bar "|."
}
\new Staff = "down" {
\clef bass \key c \major \numericTimeSignature \time 3/4 \tempo 4 = 60 \partial 4
r4 | % 0
c2.-5 | % 1
c2.-5 | % 2
f,2.-5 | % 3
c2.-5 | \break % 4
c2.-5 | % 5
c2.-5 | % 6
g,2.-5 | % 7
g,2.-5 | \break % 8
c2.-5 | % 9
c2.-5 | % 10
f,2.-5 | % 11
c2.-5 | \break % 12
c2.-5 | % 13
g,2.-5 | % 14
c2.-5 | % 15
c2-5 \break % 16
\bar "|."
}
>>
\layout { }
\midi { }
}
