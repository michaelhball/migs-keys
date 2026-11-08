% Capture score source locations for synchronising the public-domain engraving.
#(define capture-port (open-output-file (string-append (ly:parser-output-name) "-events.tsv")))
#(define (capture-notes context)
  (make-engraver
    (listeners
      ((note-event engraver event)
        (let* ((moment (ly:context-current-moment context))
               (origin (ly:input-file-line-char-column (ly:event-property event 'origin)))
               (staff (ly:context-find context 'Staff)))
          (format capture-port "~a\t~a\t~a\t~a\t~a\t~a\n"
            (ly:context-id staff)
            (ly:moment-main moment)
            (ly:moment-grace moment)
            (+ 60 (ly:pitch-semitones (ly:event-property event 'pitch)))
            (cadr origin) (caddr origin)))))
    ((finalize engraver) (force-output capture-port))))
