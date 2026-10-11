import QtQuick
import QtQuick.Controls

Item {
  id: bar

  property var theme: null
  property var view: null

  Rectangle {
    anchors.left: parent.left
    anchors.right: parent.right
    anchors.bottom: parent.bottom
    height: 1
    color: bar.theme.line
  }

  Rectangle {
    id: selector
    objectName: "kanbanSelector"
    x: 18
    anchors.verticalCenter: parent.verticalCenter
    width: Math.max(120, Math.min(340, bar.width - newButton.width - 54))
    height: 34
    radius: 7
    color: selectHover.hovered ? bar.theme.hover : bar.theme.surface
    border.width: 1
    border.color: bar.theme.line

    Text {
      x: 12
      width: parent.width - 42
      anchors.verticalCenter: parent.verticalCenter
      textFormat: Text.PlainText
      text: { var r = bar.view.revision; return bar.view.page ? bar.view.page.title || "Untitled" : bar.view.kanbanLoading ? "Finding boards…" : "Choose a board" }
      elide: Text.ElideRight
      font.family: bar.theme.uiFont
      font.pixelSize: 13
      color: bar.theme.text
    }
    Icon {
      anchors.right: parent.right
      anchors.rightMargin: 10
      anchors.verticalCenter: parent.verticalCenter
      theme: bar.theme
      text: bar.theme.icons.down
      size: 14
      color: bar.theme.muted
    }
    HoverHandler { id: selectHover; cursorShape: Qt.PointingHandCursor }
    TapHandler { onTapped: boards.open() }

    Popup {
      id: boards
      objectName: "kanbanBoardPicker"
      y: selector.height + 6
      width: Math.max(240, selector.width)
      height: Math.min(350, Math.max(56, bar.view.kanbanBoards.length * 52 + 12))
      padding: 6
      closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside
      background: Rectangle { color: bar.theme.surfaceHigh; radius: 9; border.width: 1; border.color: bar.theme.line }
      contentItem: ListView {
        clip: true
        model: bar.view.kanbanBoards
        ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }
        delegate: Rectangle {
          id: row
          required property var modelData
          objectName: "kanbanBoardRow"
          width: ListView.view.width
          height: 52
          radius: 6
          color: bar.view.kanbanPageId === modelData.pageId ? bar.theme.pressed : rowHover.hovered ? bar.theme.hover : "transparent"
          Column {
            x: 10
            anchors.verticalCenter: parent.verticalCenter
            width: parent.width - 20
            spacing: 3
            Text {
              width: parent.width
              textFormat: Text.PlainText
              text: row.modelData.title
              elide: Text.ElideRight
              font.family: bar.theme.uiFont
              font.pixelSize: 13
              color: bar.theme.text
            }
            Text {
              width: parent.width
              textFormat: Text.PlainText
              text: row.modelData.path || (row.modelData.boardIds.length === 1 ? "1 board" : row.modelData.boardIds.length + " boards")
              elide: Text.ElideRight
              font.family: bar.theme.uiFont
              font.pixelSize: 11
              color: bar.theme.muted
            }
          }
          HoverHandler { id: rowHover; cursorShape: Qt.PointingHandCursor }
          TapHandler { onTapped: { boards.close(); bar.view.openKanban(row.modelData.pageId) } }
        }
        Text {
          anchors.centerIn: parent
          visible: bar.view.kanbanBoards.length === 0
          textFormat: Text.PlainText
          text: bar.view.kanbanLoading ? "Finding boards…" : "No boards yet"
          font.family: bar.theme.uiFont
          font.pixelSize: 12
          color: bar.theme.muted
        }
      }
    }
  }

  IconButton {
    id: newButton
    objectName: "newKanban"
    anchors.right: parent.right
    anchors.rightMargin: 18
    anchors.verticalCenter: parent.verticalCenter
    theme: bar.theme
    icon: bar.theme.icons.plus
    label: "New board"
    size: 34
    active: bar.view.workspace !== null && bar.view.workspace.ready && !bar.view.switching
    onClicked: bar.view.newKanban()
  }

  onVisibleChanged: if (!visible) boards.close()
}
