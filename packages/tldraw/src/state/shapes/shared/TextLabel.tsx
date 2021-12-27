import * as React from 'react'
import { stopPropagation } from '~components/stopPropagation'
import { GHOSTED_OPACITY, LABEL_POINT, LETTER_SPACING } from '~constants'
import { TLDR } from '~state/TLDR'
import { styled } from '~styles'
import { TextAreaUtils } from '.'
import { getTextLabelSize } from './getTextSize'

export interface TextLabelProps {
  font: string
  text: string
  isDarkMode: boolean
  onBlur?: () => void
  onChange: (text: string) => void
  offsetY?: number
  offsetX?: number
  scale?: number
  isEditing?: boolean
}

export const TextLabel = React.memo(function TextLabel({
  isDarkMode,
  font,
  text,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  isEditing = false,
  onBlur,
  onChange,
}: TextLabelProps) {
  const rInput = React.useRef<HTMLTextAreaElement>(null)
  const rIsMounted = React.useRef(false)
  const size = getTextLabelSize(text, font)
  const color = isDarkMode ? 'white' : 'black'

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(TLDR.normalizeText(e.currentTarget.value))
    },
    [onChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // If this keydown was just the meta key or a shortcut
      // that includes holding the meta key like (Command+V)
      // then leave the event untouched. We also have to explicitly
      // Implement undo/redo for some reason in order to get this working
      // in the vscode extension. Without the below code the following doesn't work
      //
      // - You can't cut/copy/paste when when text-editing/focused
      // - You can't undo/redo when when text-editing/focused
      // - You can't use Command+A to select all the text, when when text-editing/focused
      if (!(e.key === 'Meta' || e.metaKey)) {
        e.stopPropagation()
      } else if (e.key === 'z' && e.metaKey) {
        if (e.shiftKey) {
          document.execCommand('redo', false)
        } else {
          document.execCommand('undo', false)
        }
        e.stopPropagation()
        e.preventDefault()
        return
      }

      if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
        e.currentTarget.blur()
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          TextAreaUtils.unindent(e.currentTarget)
        } else {
          TextAreaUtils.indent(e.currentTarget)
        }

        onChange(TLDR.normalizeText(e.currentTarget.value))
      }
    },
    [onChange]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      e.currentTarget.setSelectionRange(0, 0)
      onBlur?.()
    },
    [onBlur]
  )

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!isEditing) return
      if (!rIsMounted.current) return

      if (document.activeElement === e.currentTarget) {
        e.currentTarget.select()
      }
    },
    [isEditing]
  )

  const handlePointerDown = React.useCallback(
    (e) => {
      if (isEditing) {
        e.stopPropagation()
      }
    },
    [isEditing]
  )

  React.useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        rIsMounted.current = true
        const elm = rInput.current
        if (elm) {
          elm.focus()
          elm.select()
        }
      })
    } else {
      onBlur?.()
    }
  }, [isEditing, onBlur])

  const rInnerWrapper = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const elm = rInnerWrapper.current
    if (!elm) return
    elm.style.transform = `scale(${scale}, ${scale}) translate(${offsetX}px, ${offsetY}px)`
    elm.style.width = size[0] + 'px'
    elm.style.height = size[1] + 'px'
  }, [size, offsetY, offsetX, scale])

  return (
    <TextWrapper>
      <InnerWrapper
        ref={rInnerWrapper}
        style={{
          font,
          color,
        }}
      >
        {isEditing ? (
          <TextArea
            ref={rInput}
            style={{
              font,
              color,
            }}
            name="text"
            tabIndex={-1}
            autoComplete="false"
            autoCapitalize="false"
            autoCorrect="false"
            autoSave="false"
            autoFocus
            placeholder=""
            spellCheck="true"
            wrap="off"
            dir="auto"
            datatype="wysiwyg"
            defaultValue={text}
            color={color}
            onFocus={handleFocus}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPointerDown={handlePointerDown}
            onContextMenu={stopPropagation}
          />
        ) : (
          text
        )}
        &#8203;
      </InnerWrapper>
    </TextWrapper>
  )
})

const TextWrapper = styled('div', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  userSelect: 'none',
  variants: {
    isGhost: {
      false: { opacity: 1 },
      true: { transition: 'opacity .2s', opacity: GHOSTED_OPACITY },
    },
  },
})

const commonTextWrapping = {
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
}

const InnerWrapper = styled('div', {
  position: 'absolute',
  padding: '4px',
  zIndex: 1,
  minHeight: 1,
  minWidth: 1,
  lineHeight: 1,
  letterSpacing: LETTER_SPACING,
  outline: 0,
  fontWeight: '500',
  textAlign: 'center',
  backfaceVisibility: 'hidden',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
  pointerEvents: 'all',
  isEditing: {
    false: {
      userSelect: 'none',
    },
    true: {
      background: '$boundsBg',
      userSelect: 'text',
      WebkitUserSelect: 'text',
    },
  },
  ...commonTextWrapping,
})

const TextArea = styled('textarea', {
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 1,
  width: '100%',
  height: '100%',
  border: 'none',
  padding: '4px',
  resize: 'none',
  textAlign: 'inherit',
  minHeight: 'inherit',
  minWidth: 'inherit',
  lineHeight: 'inherit',
  letterSpacing: 'inherit',
  outline: 0,
  fontWeight: 'inherit',
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
  display: 'inline-block',
  pointerEvents: 'all',
  background: '$boundsBg',
  userSelect: 'text',
  WebkitUserSelect: 'text',
  ...commonTextWrapping,
})
