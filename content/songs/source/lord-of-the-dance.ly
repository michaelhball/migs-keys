\version "2.26.0"
\header { title = "Simple Gifts" subtitle = "Beginner · melody and bass · C major" composer = "Joseph Brackett · traditional tune" poet = "Joseph Brackett · original words (1848)" tagline = ##f }
#(set-global-staff-size 18)
\paper { top-margin = 10\mm bottom-margin = 10\mm ragged-last-bottom = ##t }
\layout { \context { \Voice \override Fingering.output-attributes = #'((class . "score-fingering")) } }
\score {
\new PianoStaff <<
\new Staff = "up" {
\new Voice = "melody" {
\clef treble \key c \major \numericTimeSignature \time 4/4 \tempo 4 = 60 \partial 4
g8-1 g8-1 | % 0
\mark \markup "A" c'4-1 c'8-1 d'8-2 e'8-3 c'8-1 e'8-3 f'8-4 | % 1
g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1 | \break % 2
d'4-2 d'4-2 d'4-2 c'4-1 | % 3
d'8-3 e'8-4 d'8-3 b8-2 g4-1 g4-1 | \break % 4
c'8-3 b8-2 c'8-3 d'8-4 e'8-5 d'8-4 e'8-3 f'8-4 | % 5
g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1 | \break % 6
d'4-2 d'4-2 e'4-3 e'8-3 d'8-2 | % 7
\mark \markup "B begins on beat 2" c'4-1 c'8-1 c'8-1 c'2-1 | \pageBreak % 8
g'2-5 e'4.-3 d'8-2 | % 9
e'8-3 f'8-4 e'8-3 d'8-2 c'4.-1 d'8-2 | \break % 10
e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3 | % 11
d'4-3 d'8-3 e'8-4 d'4-3 g4-1 | \break % 12
c'2-1 c'4.-1 d'8-2 | % 13
e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3 | \break % 14
d'4-2 d'4-2 e'4-3 e'8-3 d'8-2 | % 15
c'4-1 c'4-1 c'4-1 \break % 16
\bar "|."
}
}
\new Lyrics \lyricsto "melody" {
"’Tis" the
gift to be sim -- ple, "’tis" the
gift to be free, "’Tis" the
gift to come down
where we ought to be, And
when we find our -- selves in the place
just right, "’Twill" be in the
val -- ley of love and
delight. When true sim --
pli -- ci -- ty
is __ _ gained, __ _ _ To
bow and to bend we "shan’t"
be a -- _ shamed, To
turn, turn will
be our de -- light, Till by
turn -- ing, turn -- ing we
come round right.
}
\new Staff = "down" {
\clef bass \key c \major \numericTimeSignature \time 4/4 \tempo 4 = 60 \partial 4
r4 | % 0
c1-5 | % 1
c1-5 | \break % 2
g,1-5 | % 3
g,1-5 | \break % 4
c1-5 | % 5
c1-5 | \break % 6
g,1-5 | % 7
c1-5 | \pageBreak % 8
c1-5 | % 9
c1-5 | \break % 10
c1-5 | % 11
g,1-5 | \break % 12
c1-5 | % 13
c1-5 | \break % 14
g,1-5 | % 15
c2.-5 \break % 16
\bar "|."
}
>>
\layout { }
\midi { }
}
